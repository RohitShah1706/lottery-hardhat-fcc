require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()


module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      blockConfirmation: 1,
    },
    goerli: {
      url: process.env.ALCHEMY_TESTNET_LINK_GOERLI,
      accounts: [
        process.env.METAMASK_PRIVATE_KEY_FOR_TESTNET
      ],
      chainId: 5,
      blockConfirmations: 6,
    },
    localhost: {
      url:"http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  // ! used to get the account when we do getNamedAccounts()
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player:{
      default: 1,
    }
  },
  // ! for verifying contracts on etherscan
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  // ! for reporting gas usage
  gasReporter: {
    enable: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  // ! timeout before a test fails
  mocha: {
    timeout: 600000, // 600 seconds
  } 
};
