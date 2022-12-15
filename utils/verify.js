const {run} = require("hardhat");
const verify = async(contractAddress, args) => {
    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: args,
    })
    .then(() => {
        console.log("Contract verified");
    })
    .catch(err => {
        if(err.message.toLowerCase().includes("already verified"))
        {
            console.log("Contract already verified")
        }
        else{
            console.log(err);
        }
    })
}
module.exports = {verify}