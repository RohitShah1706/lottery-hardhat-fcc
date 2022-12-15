// 00 - MOCK
const { ethers } = require("hardhat");
const {networkConfig, developmentChains} = require("../helper-hardhat-config")
const BASE_FEE = ethers.utils.parseEther("0.25").toString() // ! 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // ! link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = hre;
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    // const chainId = network.config.chainId

    const chainId = hre.network.config.chainId;
    
    const args = [BASE_FEE,GAS_PRICE_LINK];
    if(developmentChains.includes(hre.network.name)){
        log("Local network detected");
        log("Deploying mocks on development chain");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks deployed");
        log("---------------------------------------------------");

    }
}
module.exports.tags = ["all","mocks"];