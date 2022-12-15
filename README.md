
# Hardhat Lottery Cmart Contract

This smart contract allows users to enter a lottery by funding the prize pool using GoerliETH.  
Chainlink keepers call performUpKeep of the contract at regular intervals to decide a randomised  
winner in a true decentralised manner using Chainlink VRF.

More info on [Chainlink keepers](https://docs.chain.link/vrf/v2/introduction/) - allows smart contract to access random variables without compromising security.  
The proof for the randomised number is published and verified on chain before consuming it.

Frontend Hosted on Fleek - [Lottery DAPP](https://nextjs-lottery-fcc.on.fleek.co/)  
Contract deployed using Hardhat - [Lottery.sol](https://goerli.etherscan.io/address/0xAad95056EB2e0dC968aB1065c9846c005416E83c)  
Hardhat code & Waffle tests - [lottery-hardhat-fcc](https://github.com/RohitShah1706/lottery-hardhat-fcc) 




## Deployment

To intall this project run

```bash
  yarn install
```


To deploy this project 

```bash
  yarn hardhat deploy
```


To run automated Waffle Tests  

```bash
  yarn hardhat test 
```




## Acknowledgements

 - [Blockchain course FCC](https://www.youtube.com/watch?v=gyMwXuJrbJQ)
 - [Hardhat Documentation](https://hardhat.org/)  
 - [Chainlink Docs](https://docs.chain.link/)


## Authors

- [@RohitShah1706](https://github.com/RohitShah1706)

