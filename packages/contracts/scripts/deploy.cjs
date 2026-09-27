// packages/contracts/scripts/deploy.cjs
const hre = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;

  console.log("==================================================");
  console.log(`Spectra Smart Contract Deployment: ${networkName}`);
  console.log("==================================================");

  if (!deployer) {
    console.error("\n❌ Error: No deployer account configured for this network.");
    console.error("Please set DEPLOYER_PRIVATE_KEY in your .env file or environment:");
    console.error("  export DEPLOYER_PRIVATE_KEY=\"0xYOUR_PRIVATE_KEY\"");
    process.exit(1);
  }

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceBnb = hre.ethers.formatEther(balance);

  console.log(`Deployer Account: ${deployer.address}`);
  console.log(`Deployer Balance: ${balanceBnb} BNB`);

  if (balance === 0n && networkName !== "hardhat") {
    console.error(`\n❌ Deployment stopped: Deployer account ${deployer.address} has 0.0 BNB on ${networkName}.`);
    if (networkName === "bscTestnet") {
      console.error("👉 Please fund this wallet with free testnet BNB from:");
      console.error("   https://testnet.binance.org/faucet-smart");
      console.error("   or BNB Chain Discord Faucet: https://discord.com/invite/bnbchain");
    } else if (networkName === "bscMainnet") {
      console.error("👉 Please fund this wallet with BSC Mainnet BNB (~0.01 BNB for gas).");
    }
    console.error("\nAlternatively, set your own funded wallet private key in .env:");
    console.error("   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY\n");
    process.exit(1);
  }

  // 1. Deploy FixedPointMath Library
  console.log("\n[1/6] Deploying FixedPointMath library...");
  const FixedPointMathFactory = await hre.ethers.getContractFactory("FixedPointMath");
  const fixedPointMath = await FixedPointMathFactory.deploy();
  await fixedPointMath.waitForDeployment();
  const fixedPointMathAddress = await fixedPointMath.getAddress();
  console.log(`✓ FixedPointMath deployed at: ${fixedPointMathAddress}`);

  // 2. Deploy OracleWatch
  console.log("\n[2/6] Deploying OracleWatch...");
  const OracleWatchFactory = await hre.ethers.getContractFactory("OracleWatch");
  const oracleWatch = await OracleWatchFactory.deploy();
  await oracleWatch.waitForDeployment();
  const oracleWatchAddress = await oracleWatch.getAddress();
  console.log(`✓ OracleWatch deployed at: ${oracleWatchAddress}`);

  // 3. Deploy PolicyVault
  console.log("\n[3/6] Deploying PolicyVault...");
  const PolicyVaultFactory = await hre.ethers.getContractFactory("PolicyVault");
  const policyVault = await PolicyVaultFactory.deploy();
  await policyVault.waitForDeployment();
  const policyVaultAddress = await policyVault.getAddress();
  console.log(`✓ PolicyVault deployed at: ${policyVaultAddress}`);

  // 4. Deploy ReceiptRegistry
  console.log("\n[4/6] Deploying ReceiptRegistry...");
  const ReceiptRegistryFactory = await hre.ethers.getContractFactory("ReceiptRegistry");
  const receiptRegistry = await ReceiptRegistryFactory.deploy();
  await receiptRegistry.waitForDeployment();
  const receiptRegistryAddress = await receiptRegistry.getAddress();
  console.log(`✓ ReceiptRegistry deployed at: ${receiptRegistryAddress}`);

  // 5. Deploy ExecutionPlanVerifier (EIP-712)
  console.log("\n[5/6] Deploying ExecutionPlanVerifier (EIP-712)...");
  const signerAddress = deployer.address;
  const ExecutionPlanVerifierFactory = await hre.ethers.getContractFactory("ExecutionPlanVerifier");
  const planVerifier = await ExecutionPlanVerifierFactory.deploy(signerAddress);
  await planVerifier.waitForDeployment();
  const planVerifierAddress = await planVerifier.getAddress();
  console.log(`✓ ExecutionPlanVerifier deployed at: ${planVerifierAddress} (Signer: ${signerAddress})`);

  // 6. Deploy MockFacilitator (b402 Shadow Gateway)
  console.log("\n[6/6] Deploying MockFacilitator (b402 Shadow Facilitator)...");
  const MockFacilitatorFactory = await hre.ethers.getContractFactory("MockFacilitator");
  const mockFacilitator = await MockFacilitatorFactory.deploy();
  await mockFacilitator.waitForDeployment();
  const mockFacilitatorAddress = await mockFacilitator.getAddress();
  console.log(`✓ MockFacilitator deployed at: ${mockFacilitatorAddress}`);

  // Prepare deployment artifact
  const deploymentData = {
    network: networkName,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FixedPointMath: fixedPointMathAddress,
      OracleWatch: oracleWatchAddress,
      PolicyVault: policyVaultAddress,
      ReceiptRegistry: receiptRegistryAddress,
      ExecutionPlanVerifier: planVerifierAddress,
      MockFacilitator: mockFacilitatorAddress,
    },
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\nDeployment records saved to: ${outputPath}`);
  console.log("==================================================");

  // Optional BscScan Verification
  if (process.env.BSCSCAN_API_KEY && networkName !== "hardhat") {
    console.log("\nInitiating BscScan contract verification...");
    console.log("Waiting 15 seconds for block confirmations before verification...");
    await new Promise((r) => setTimeout(r, 15000));

    const verifyContract = async (address, constructorArguments = []) => {
      try {
        console.log(`Verifying ${address}...`);
        await hre.run("verify:verify", {
          address,
          constructorArguments,
        });
        console.log(`✓ Verified ${address}`);
      } catch (err) {
        console.warn(`Verification note for ${address}: ${err.message}`);
      }
    };

    await verifyContract(fixedPointMathAddress);
    await verifyContract(oracleWatchAddress);
    await verifyContract(policyVaultAddress);
    await verifyContract(receiptRegistryAddress);
    await verifyContract(planVerifierAddress, [signerAddress]);
    await verifyContract(mockFacilitatorAddress);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
