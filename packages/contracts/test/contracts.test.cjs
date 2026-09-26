const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Spectra Smart Contracts", function () {
  let owner, user, backendSigner, otherSigner;
  let oracleWatch, policyVault, receiptRegistry, planVerifier;

  const PRECISION = ethers.parseEther("1"); // 1e18

  beforeEach(async function () {
    [owner, user, backendSigner, otherSigner] = await ethers.getSigners();

    // Deploy OracleWatch
    const OracleWatch = await ethers.getContractFactory("OracleWatch");
    oracleWatch = await OracleWatch.deploy();
    await oracleWatch.waitForDeployment();

    // Deploy PolicyVault
    const PolicyVault = await ethers.getContractFactory("PolicyVault");
    policyVault = await PolicyVault.deploy();
    await policyVault.waitForDeployment();

    // Deploy ReceiptRegistry
    const ReceiptRegistry = await ethers.getContractFactory("ReceiptRegistry");
    receiptRegistry = await ReceiptRegistry.deploy();
    await receiptRegistry.waitForDeployment();

    // Deploy ExecutionPlanVerifier
    const ExecutionPlanVerifier = await ethers.getContractFactory("ExecutionPlanVerifier");
    planVerifier = await ExecutionPlanVerifier.deploy(backendSigner.address);
    await planVerifier.waitForDeployment();
  });

  describe("OracleWatch.sol", function () {
    it("records divergence snapshots and emits DivergenceRecorded", async function () {
      const perSharePrice = ethers.parseEther("335.02");
      const tradfiPrice = ethers.parseEther("333.90");

      const tx = await oracleWatch.recordSnapshot("AAPL", perSharePrice, tradfiPrice);
      const receipt = await tx.wait();

      const history = await oracleWatch.getHistory("AAPL");
      expect(history.length).to.equal(1);
      expect(history[0].perSharePrice).to.equal(perSharePrice);
      expect(history[0].tradfiPrice).to.equal(tradfiPrice);

      // Verify divergence calculation: (335.02 * 10000) / 333.90 - 10000 ≈ 33 bps
      expect(history[0].divergenceBps).to.be.closeTo(33n, 2n);
    });

    it("reverts if non-owner tries to record snapshot", async function () {
      await expect(
        oracleWatch.connect(user).recordSnapshot("AAPL", ethers.parseEther("100"), ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(oracleWatch, "OwnableUnauthorizedAccount");
    });

    it("reverts if TradFi price is zero", async function () {
      await expect(
        oracleWatch.recordSnapshot("AAPL", ethers.parseEther("100"), 0n)
      ).to.be.revertedWith("TradFi price zero");
    });
  });

  describe("PolicyVault.sol", function () {
    const maxTrade = ethers.parseEther("10"); // $10 max
    const maxSlip = 100n; // 100 bps
    const dailyLimit = ethers.parseEther("50"); // $50 daily

    beforeEach(async function () {
      await policyVault.setPolicy(user.address, maxTrade, maxSlip, dailyLimit);
    });

    it("approves valid trades conforming to policy constraints", async function () {
      const tradeAmount = ethers.parseEther("5");
      const slippage = 50n;
      const [allowed, reason] = await policyVault.checkTrade(user.address, tradeAmount, slippage);
      expect(allowed).to.be.true;
      expect(reason).to.equal("");
    });

    it("rejects trade exceeding maxTradeNotionalUsd", async function () {
      const tradeAmount = ethers.parseEther("15"); // Exceeds $10
      const [allowed, reason] = await policyVault.checkTrade(user.address, tradeAmount, 50n);
      expect(allowed).to.be.false;
      expect(reason).to.equal("MAX_TRADE_EXCEEDED");
    });

    it("rejects trade exceeding maxSlippageBps", async function () {
      const tradeAmount = ethers.parseEther("5");
      const [allowed, reason] = await policyVault.checkTrade(user.address, tradeAmount, 150n); // Exceeds 100 bps
      expect(allowed).to.be.false;
      expect(reason).to.equal("MAX_SLIPPAGE_EXCEEDED");
    });

    it("rejects trades when kill switch is toggled active", async function () {
      await policyVault.toggleKillSwitch(user.address, true);
      const [allowed, reason] = await policyVault.checkTrade(user.address, ethers.parseEther("5"), 50n);
      expect(allowed).to.be.false;
      expect(reason).to.equal("KILL_SWITCH_ACTIVE");

      // Re-enable
      await policyVault.toggleKillSwitch(user.address, false);
      const [reallowed, _] = await policyVault.checkTrade(user.address, ethers.parseEther("5"), 50n);
      expect(reallowed).to.be.true;
    });

    it("records trade executions and enforces daily limit", async function () {
      // Execute $48 trade
      await policyVault.recordTrade(user.address, ethers.parseEther("48"));

      // Check another $5 trade -> should fail ($48 + $5 = $53 > $50)
      const [allowed, reason] = await policyVault.checkTrade(user.address, ethers.parseEther("5"), 50n);
      expect(allowed).to.be.false;
      expect(reason).to.equal("DAILY_LIMIT_EXCEEDED");
    });
  });

  describe("ReceiptRegistry.sol", function () {
    it("records and retrieves execution receipts with hashes", async function () {
      const decisionHash = ethers.keccak256(ethers.toUtf8Bytes("decision:1"));
      const simulationHash = ethers.keccak256(ethers.toUtf8Bytes("simulation:1"));
      const tokenIn = ethers.ZeroAddress;
      const tokenOut = user.address;
      const amountIn = ethers.parseEther("10");
      const expectedOut = ethers.parseEther("9.9");
      const actualOut = ethers.parseEther("9.89");

      await receiptRegistry.recordReceipt(
        user.address,
        decisionHash,
        simulationHash,
        tokenIn,
        tokenOut,
        amountIn,
        expectedOut,
        actualOut,
        "ORACLE_DIVERGENCE"
      );

      const count = await receiptRegistry.receiptCounts(user.address);
      expect(count).to.equal(1n);

      const receipt = await receiptRegistry.getReceipt(user.address, 0);
      expect(receipt.decisionHash).to.equal(decisionHash);
      expect(receipt.simulationHash).to.equal(simulationHash);
      expect(receipt.signalType).to.equal("ORACLE_DIVERGENCE");
      expect(receipt.amountIn).to.equal(amountIn);
    });
  });

  describe("ExecutionPlanVerifier.sol (EIP-712)", function () {
    it("verifies structured EIP-712 signatures signed by authorized backendSigner", async function () {
      const domain = {
        name: "Spectra",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await planVerifier.getAddress(),
      };

      const types = {
        ExecutionPlan: [
          { name: "user", type: "address" },
          { name: "targetToken", type: "address" },
          { name: "amountUsd", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const targetToken = "0x1111111111111111111111111111111111111111";
      const amountUsd = ethers.parseEther("10");
      const nonce = 1n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour in future

      const value = {
        user: user.address,
        targetToken,
        amountUsd,
        nonce,
        deadline,
      };

      // Sign with authorized backend signer
      const signature = await backendSigner.signTypedData(domain, types, value);

      const isValid = await planVerifier.verifyPlan(
        user.address,
        targetToken,
        amountUsd,
        nonce,
        deadline,
        signature
      );
      expect(isValid).to.be.true;

      // Sign with unauthorized signer -> must return false
      const badSignature = await otherSigner.signTypedData(domain, types, value);
      const isBadValid = await planVerifier.verifyPlan(
        user.address,
        targetToken,
        amountUsd,
        nonce,
        deadline,
        badSignature
      );
      expect(isBadValid).to.be.false;
    });

    it("reverts if execution plan has expired", async function () {
      const targetToken = "0x1111111111111111111111111111111111111111";
      const pastDeadline = 1000n; // In past
      const signature = "0x" + "00".repeat(65);

      await expect(
        planVerifier.verifyPlan(user.address, targetToken, ethers.parseEther("10"), 1n, pastDeadline, signature)
      ).to.be.revertedWith("Plan expired");
    });
  });
});
