const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config")

!developmentChains.includes(hre.network.name)
    ? describe.skip:
    describe("Lottery unit test", function () {
        let lottery, vrfCoordinatorV2Mock, lotteryEntranceFee,deployer,interval;
        const chainId = network.config.chainId;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            // ! Deploy everything
            await deployments.fixture(["all"]);
            // ! get lottery contract & mock vrf
            lottery = await ethers.getContract("Lottery", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            // ! get the entrance fee, interval
            lotteryEntranceFee = await lottery.getEntranceFee();
            interval = await lottery.getInterval();
        })

        describe("constructor", () => {
            it("Initializes the lottery contract",async() => {
                const lotteryState = await lottery.getLotteryState();
                assert.equal(lotteryState.toString(), "0");
                
                const interval = await lottery.getInterval();
                assert.equal(interval.toString(), networkConfig[chainId].interval)
            })
        })
        
        describe("enterLottery", () => {
            it("Reverts if you don't pay enough", async () => {
                await expect(lottery.enterLottery()).to.be.revertedWith("Lottery_NotEnough_ETH_Entered");
            })
            it("Records players when they enter", async() => {
                await lottery.enterLottery({value: lotteryEntranceFee});
                const playerFromContract = await lottery.getPlayer(0);
                assert.equal(playerFromContract, deployer);
            })
            it("Emits event on entry of player", async () => {
                await expect(lottery.enterLottery({value: lotteryEntranceFee}))
                .to.emit(lottery, "LotteryEnter");
            })
            it("Should not allow players to enter in calculating state", async() => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                // ! we need to call performUpKeep to change the state to calculating
                // ! but for the checkUpKeep should return true
                // ! so we somehow need to pass the interval time so that checkUpKeep returns true
                // ! then we act as chainLink and call performUpKeep
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await lottery.performUpkeep([]);

                // now we should be in calculating state
                const lotteryState = await lottery.getLotteryState();
                await assert.equal(lotteryState.toString(), "2");

                // also we should not be able to enter
                await expect(lottery.enterLottery({value: lotteryEntranceFee})).to.be.revertedWith("Lottery_NotOpen");
            })
        })
        describe("checkUpkeep", () => {
            it("Returns false if people haven't sent any ETH", async() => {
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine",[])

                // ! VIMP - callstatic - 
                /*
                    callStatic is a read-only operation and will not consume any Ether. 
                    It simulates what would happen in a transaction, but discards all the 
                    state changes when it is done.
                */ 
                const {upkeepNeeded} = await lottery.callStatic.checkUpkeep([]);
                assert(upkeepNeeded == false);
            })
            it("returns false if lottery isn't open", async () => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                await lottery.performUpkeep([]) // changes the state to calculating
                const lotteryState = await lottery.getLotteryState() // stores the new state
                const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert.equal(lotteryState.toString() == "2", upkeepNeeded == false)
            })
            it("returns false if enough time hasn't passed", async () => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(!upkeepNeeded)
            })
            it("returns true if enough time has passed, has players, eth, and is open", async () => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                assert(upkeepNeeded)
            })
        })
        describe("performUpkeep",() => {
            it("can only run if checkupkeep is true", async () => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const tx = await lottery.performUpkeep("0x") 
                assert(tx)
            })
            it("reverts if checkup is false", async () => {
                await expect(lottery.performUpkeep([])).to.be.revertedWith( 
                    "Lottery_UpkeepNotNeeded"
                )
            })
            it("updates the lottery state and emits a requestId", async () => {
                await lottery.enterLottery({ value: lotteryEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })

                const txResponse = await lottery.performUpkeep("0x") // emits requestId
                const txReceipt = await txResponse.wait(1) // waits 1 block
                const lotteryState = await lottery.getLotteryState() // updates state to calculatin
                // ! now we're getting the second event cuz mockVRFCoordinatorV2Mock also emits an event performUpkeep calls requestRandomWords - CHECKOUT VRFCoordinatorV2Mock.sol
                const requestId = txReceipt.events[1].args.requestId
                assert(requestId.toNumber() > 0)
                assert(lotteryState.toString() == "2") // 0 = open, 2 = calculating
            })
        })

        describe("fulfillRandomWords", () => {
            beforeEach(async () => {
                // ! before we ask for a random word, let's have someone enter the lottery
                await lottery.enterLottery({value:lotteryEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
            })

            // ! fulfillRandomWords can only be called after requestRandomWords is called
            it("Can only be called after performUpkeep that calls requestRandomWords", async()=> {
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0,lottery.address)).to.be.revertedWith("nonexistent request")
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1,lottery.address)).to.be.revertedWith("nonexistent request")
            })

            // This test is too big...
            // This test simulates users entering the lottery and wraps the entire functionality of the lottery
            // inside a promise that will resolve if everything is successful.
            // An event listener for the WinnerPicked is set up
            // Mocks of chainlink keepers and vrf coordinator are used to kickoff this winnerPicked event
            // All the assertions are done once the WinnerPicked event is fired
            it("picks a winner, resets, and sends money", async () => {
                const additionalEntrances = 3 // to test
                const startingAccountIndex = 2 // deployer = 0
                const accounts = await ethers.getSigners();
                for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrances; i++) { // i = 2; i < 5; i=i+1
                    accountConnectedLottery = lottery.connect(accounts[i]) // Returns a new instance of the Lottery contract connected to player
                    await accountConnectedLottery.enterLottery({ value: lotteryEntranceFee })
                } 
                const startingTimeStamp = await lottery.getLastTimeStamp() // stores starting timestamp (before we fire our event)

                  // This will be more important for our staging tests...
                // ! can't just call fulfillRandomWords directly once conditions are met
                // ! we want to simulate that wait for interval - so we create a new Promise 
                // ! that listens for WinnerPicked event to be emitted.
                await new Promise(async (resolve, reject) => {
                    lottery.once("WinnerPicked", async () => { // event listener for WinnerPicked
                        console.log("WinnerPicked event fired!")
                        // assert throws an error if it fails, so we need to wrap
                        // it in a try/catch so that the promise returns event
                        // if it fails.
                        try {
                            // Now lets get the ending values...
                            const recentWinner = await lottery.getRecentWinner()
                            const lotteryState = await lottery.getLotteryState()
                            const winnerEndingBalance = await accounts[2].getBalance()
                            const endingTimeStamp = await lottery.getLastTimeStamp()
                            const numPlayers = await lottery.getNumberOfPlayers();
                            assert.equal(numPlayers.toString(),"0") // checking if players array reseted
                            // await expect(lottery.getPlayer(0)).to.be.reverted
                            // Comparisons to check if our ending values are correct:
                            assert.equal(recentWinner.toString(), accounts[2].address)
                            assert.equal(lotteryState.toString(), "0")
                            assert.equal(
                                winnerEndingBalance.toString(), 
                                startingBalance // startingBalance + ( (lotteryEntranceFee * additionalEntrances) + lotteryEntranceFee )
                                    .add(
                                        lotteryEntranceFee
                                            .mul(additionalEntrances)
                                            .add(lotteryEntranceFee)
                                    )
                                    .toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve() // if try passes, resolves the promise 
                        } catch (e) { 
                            reject(e) // if try fails, rejects the promise
                        }
                    })

                    // ! kicking off the event by mocking the chainlink keepers and vrf coordinator
                    // ! call performUpkeep that call checkUpkeep to check - once true calls requestRandomWords - which returns reponse by calling fulfillRandomWords 
                    // ! which then emits our event and Promise is kicked off.
                    const tx = await lottery.performUpkeep([])
                    const txReceipt = await tx.wait(1)
                    const startingBalance = await accounts[2].getBalance()
                    // ! fulfillRandomWords takes - subscriptionId, and address of contract.
                    await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        lottery.address
                    )
                })
            })
        })
})