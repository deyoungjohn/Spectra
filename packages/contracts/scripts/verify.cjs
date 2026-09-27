// packages/contracts/scripts/verify.cjs
const hre = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const networkName = hre.network.name;

  console.log("==================================================");
  console.log(`Spectra Smart Contract Verification: ${networkName}`);
  console.log("==================================================");

  if (!process.env.BSCSCAN_API_KEY) {
    console.error("\n❌ Error: BSCSCAN_API_KEY is not set.");
    console.error("Please add BSCSCAN_API_KEY to your .env file:");
    console.error("   BSCSCAN_API_KEY=YOUR_API_KEY\n");
    process.exit(1);
  }

  const deploymentPath = path.join(__dirname, `../deployments/${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error(`\n❌ Error: No deployment record found at ${deploymentPath}`);
    console.error(`Please deploy to ${networkName} first using npm run deploy:${networkName === "bscTestnet" ? "testnet" : "mainnet"}`);
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const { contracts, deployer } = deployment;

  console.log(`Deployer: ${deployer}`);
  console.log(`Contracts loaded from: deployments/${networkName}.json\n`);

  const baseUrl =
    networkName === "bscTestnet"
      ? "https://testnet.bscscan.com/address"
      : "https://bscscan.com/address";

  const toVerify = [
    {
      name: "FixedPointMath",
      address: contracts.FixedPointMath,
      contract: "contracts/FixedPointMath.sol:FixedPointMath",
      args: [],
    },
    {
      name: "OracleWatch",
      address: contracts.OracleWatch,
      contract: "contracts/OracleWatch.sol:OracleWatch",
      args: [],
    },
    {
      name: "PolicyVault",
      address: contracts.PolicyVault,
      contract: "contracts/PolicyVault.sol:PolicyVault",
      args: [],
    },
    {
      name: "ReceiptRegistry",
      address: contracts.ReceiptRegistry,
      contract: "contracts/ReceiptRegistry.sol:ReceiptRegistry",
      args: [],
    },
    {
      name: "ExecutionPlanVerifier",
      address: contracts.ExecutionPlanVerifier,
      contract: "contracts/ExecutionPlan.sol:ExecutionPlanVerifier",
      args: [deployer],
    },
    {
      name: "MockFacilitator",
      address: contracts.MockFacilitator,
      contract: "contracts/MockFacilitator.sol:MockFacilitator",
      args: [],
    },
  ];

  for (let i = 0; i < toVerify.length; i++) {
    const item = toVerify[i];
    console.log(`[${i + 1}/${toVerify.length}] Verifying ${item.name} (${item.address})...`);

    try {
      await hre.run("verify:verify", {
        address: item.address,
        constructorArguments: item.args,
        contract: item.contract,
      });
      console.log(`✓ Verified: ${baseUrl}/${item.address}#code\n`);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes("already verified")) {
        console.log(`✓ Already verified: ${baseUrl}/${item.address}#code\n`);
      } else {
        console.warn(`⚠️ Verification note: ${err.message}\n`);
      }
    }
  }

  console.log("==================================================");
  console.log("All verification tasks completed!");
  console.log("==================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
