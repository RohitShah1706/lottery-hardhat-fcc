const { ethers } = require("hardhat");

const networkConfig = {
    default: {
        name: "hardhat",
        interval: "30",
    },
    1: {
        name: "mainnet",
        interval: "30",
    },
    5: {
        name:"goerli",
        vrfCoordinatorV2Address: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId:"6584",
        callBackGasLimit:"500000",
        interval: "30",
    },
    31337: {
        name:"localhost",
        subscriptionId: "588",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callBackGasLimit:"500000",
        interval: "30",
    }
}
const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}