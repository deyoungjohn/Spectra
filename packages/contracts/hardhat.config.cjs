require("@nomicfoundation/hardhat-toolbox");

const BSC_TESTNET_RPC = process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/";
const BSC_MAINNET_RPC = process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed.binance.org/";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BSCSCAN_KEY = process.env.BSCSCAN_API_KEY || "";

const accounts = DEPLOYER_KEY ? [DEPLOYER_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    bscTestnet: {
      url: BSC_TESTNET_RPC,
      chainId: 97,
      accounts,
      gasPrice: 10000000000,
    },
    bscMainnet: {
      url: BSC_MAINNET_RPC,
      chainId: 56,
      accounts,
      gasPrice: 3000000000,
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: BSCSCAN_KEY,
      bsc: BSCSCAN_KEY,
    },
  },
  analytics: {
    enabled: false,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

