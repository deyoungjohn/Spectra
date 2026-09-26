const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockFacilitator.sol (b402 Shadow Gateway Facilitator)", function () {
  let owner, payer, payee, other;
  let facilitator;

  beforeEach(async function () {
    [owner, payer, payee, other] = await ethers.getSigners();

    const MockFacilitator = await ethers.getContractFactory("MockFacilitator");
    facilitator = await MockFacilitator.deploy();
    await facilitator.waitForDeployment();
  });

  it("settles payment and emits PaymentSettled event", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("b402-payment-1"));
    const amount = ethers.parseUnits("0.02", 6); // 20,000 units (0.02 USDC)

    const tx = await facilitator.settlePayment(paymentId, payer.address, payee.address, amount, "USDC");
    const receipt = await tx.wait();

    expect(await facilitator.isSettled(paymentId)).to.be.true;

    // Check emitted event
    await expect(tx)
      .to.emit(facilitator, "PaymentSettled")
      .withArgs(paymentId, payer.address, payee.address, amount, "USDC", (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
  });

  it("reverts if trying to settle the same paymentId twice", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("b402-payment-duplicate"));
    const amount = ethers.parseUnits("0.01", 6);

    await facilitator.settlePayment(paymentId, payer.address, payee.address, amount, "USDC");

    await expect(
      facilitator.settlePayment(paymentId, payer.address, payee.address, amount, "USDC")
    ).to.be.revertedWith("Payment already settled");
  });

  it("reverts if non-owner tries to settle payment", async function () {
    const paymentId = ethers.keccak256(ethers.toUtf8Bytes("b402-payment-unauthorized"));
    const amount = ethers.parseUnits("0.01", 6);

    await expect(
      facilitator.connect(other).settlePayment(paymentId, payer.address, payee.address, amount, "USDC")
    ).to.be.revertedWithCustomError(facilitator, "OwnableUnauthorizedAccount");
  });
});
