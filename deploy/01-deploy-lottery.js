// 01 - LOTTERY

const { ethers,network } = require("hardhat");
const { networkConfig,developmentChains,VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config");
const {verify} = require("../utils/verify")

const FUND_AMOUNT = ethers.utils.parseEther("1") // 1 Ether, or 1e18 (10^18) Wei

module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    let vrfCoordinatorV2Mock;
    let vrfCoordinatorV2Address,subscriptionId;
    

    if(developmentChains.includes(network.name)){
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        // ! we need a subscription id for the mock so that chainlink can call our contract's fulfillRandomWords function
        const transactionRespone = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionRespone.wait();
        subscriptionId = transactionReceipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT);
    }
    else{
        vrfCoordinatorV2Address = networkConfig[network.config.chainId].vrfCoordinatorV2Address;
        subscriptionId = networkConfig[network.config.chainId].subscriptionId;
        // ! when we're on a testnet or mainnet, we will create a subscription id on chainlink's website - then chainlink will call our contract's fulfillRandomWords function
    }

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    
    const entranceFee = networkConfig[network.config.chainId].entranceFee;
    const gasLane = networkConfig[network.config.chainId].gasLane;    
    const callBackGasLimit = networkConfig[network.config.chainId].callBackGasLimit;
    const interval = networkConfig[network.config.chainId].interval;
    const args = [
        vrfCoordinatorV2Address,  
        entranceFee.toString(), //
        gasLane,
        subscriptionId.toString(), //
        callBackGasLimit,
        interval
    ];
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })

    // ! trynna fix the addConsumer issue in vrfCoordinatorV2Mock - InvalidConsumer()
    if (network.config.chainId == 31337) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId.toNumber(), lottery.address)
    }

    // ! Verify the contract on etherScan
    if(!developmentChains.includes(hre.network.name) && process.env.ETHERSCAN_API_KEY)
    {
        log("Verifying Lottery contract on etherScan...")
        await verify(lottery.address,args);
    }
}
module.exports.tags = ["all","lottery"];