# Stake smart contract with complicated computation

This project demonstrates how calculate rewards by formulas.

lastUpdateTime = start campaign serconds
rewardRate = reward_pool /  duration							
rewardPerTokenStored = rewardPerTokenStored +( (min(currentTime, periodFinish) - lastUpdateTime)  * rewardRate / totalSupply )

lastUpdateTime = min(currentTime, periodFinish)

rewards[userAddress] = userTotalDeposit * (rewardPerTokenStored - userRewardPerTokenPaid[userAddress]) + rewards[userAddress]		

Solidity contracts code
> contracts/

Typescript scripts code
> scripts/

Typescript tests
> test/

# Setup guide


Compile all contracts and create artifacts
> npx hardhat compile

Run a script that will deploy the contract, Reward, and Stake custom tokens.
> npx hardhat run scripts/deploy.ts

Run a script that will deploy the contract, Reward, and Stake custom tokens and run a simple example of contract execution.
> npx hardhat run scripts/deploy_reward.ts



Run for tests execution.
> npx hardhat test 