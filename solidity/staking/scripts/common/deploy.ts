import "hardhat";
import {ethers} from "hardhat";
import {ERC20, StakingPool} from "../../typechain-types";

/// Return data that holds contracts:
//      - Staking pool
//      - Derived from args or created custom, reward and staking ERC20 tokens
//      - Mint custom reward tokens to reward pool
export async function deploy(duration_in_sec: number, reward_tokens_amount: number, rew_token?: string, stake_token?: string): Promise<Deployed> {
    let reward_token;
    let staking_token;

    if (!rew_token) {
        const rewardTokenFactory = await ethers.getContractFactory("RewardToken");
        reward_token = await rewardTokenFactory.deploy();
        await reward_token.deployed();
        console.log(`Reward token Deployed at:${reward_token.address}`)
    } else {
        reward_token = await ethers.getContractAt("ERC20", rew_token);
    }

    if (!stake_token) {
        const stakingTokenFactory = await ethers.getContractFactory("StakeToken");
        staking_token = await stakingTokenFactory.deploy();
        await staking_token.deployed();
        console.log(`Staking token Deployed at:${staking_token.address}`)

    } else {
        staking_token = await ethers.getContractAt("ERC20", stake_token);
    }

    const stakingFactory = await ethers.getContractFactory("StakingPool");
    let staking_pool = await stakingFactory.deploy(
        reward_token.address,
        staking_token.address,
        duration_in_sec,
        reward_tokens_amount
    );
    await staking_pool.deployed();
    console.log(`Staking pool Deployed at:${staking_pool.address}`);


    if (!rew_token ) { // @ts-ignore
        await reward_token.mint(staking_pool.address, reward_tokens_amount);
    }

    return new Deployed(
        staking_pool,
        reward_token,
        staking_token);

}

export class Deployed {
    staking_pool: StakingPool;
    reward_token: ERC20;
    staking_token: ERC20;

    constructor(pool: StakingPool, reward: ERC20, stake: ERC20) {
        this.staking_pool = pool;
        this.reward_token = reward;
        this.staking_token = stake;
    }

}