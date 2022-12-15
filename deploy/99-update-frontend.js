const {ethers, network} = require("hardhat");
const fs = require('fs');
const FRONT_END_ADDRESSES_FILE = "../PART06-FCC-FrontEnd-NEXTJS-LotteryApp/constants/contractAddresses.json";
const FRONT_END_ABI_FILE = "../PART06-FCC-FrontEnd-NEXTJS-LotteryApp/constants/abi.json";

module.exports = async () => {
    console.log("Inside update-frontend.js",process.env.UPDATE_FRONT_END);
    if(process.env.UPDATE_FRONT_END)
    {
        console.log("Updating front end...")
        await updateContractAddress();
        await updateABI();
    }
}
const updateContractAddress = async () => {
    const lottery = await ethers.getContract("Lottery");
    const chainId = network.config.chainId.toString();
    const currentAddresses = JSON.parse(fs.readFileSync(FRONT_END_ADDRESSES_FILE,"utf8"));
    if(chainId in currentAddresses){
        if(!currentAddresses[chainId].includes(lottery.address)){
            currentAddresses[chainId].push(lottery.address);
        }
    }
    else{
        currentAddresses[chainId] = [lottery.address];
    }
    fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(currentAddresses));
}
const updateABI = async () => {
    const lottery = await ethers.getContract("Lottery");
    // ! interface directly gives us the ABI and we format it to be a JSON string
    fs.writeFileSync(FRONT_END_ABI_FILE,lottery.interface.format(ethers.utils.FormatTypes.json));
}
module.exports.tags = ["all","frontend"]