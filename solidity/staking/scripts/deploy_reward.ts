import {deploy} from "./common/deploy";
import {skip_time, Time, to_sec} from "./common/time"
import {ethers} from "hardhat";

async function main() {
    let amount_to_stake = 5;

    let [signer] = await ethers.getSigners();

    // Deploy custom tokens and staking pool, mint some reward tokens to reward pool
    // For other tokens, pass their address to the arguments
    let week_in_sec = to_sec(Time.Week, 1);

    let {staking_pool, staking_token, reward_token} = await deploy(week_in_sec, 700);

    // Approve to transfer tokens from user to contract
    await staking_token.approve(staking_pool.address, 10000);


    // simple time traveling
    await skip_time(Time.Sec, 100);
    // Stake tokens
    let stake_tx1 = await staking_pool.stake(amount_to_stake);
    // Wait for execution
    await stake_tx1.wait(1);

    let stake_tx2 = await staking_pool.stake(amount_to_stake );

    await stake_tx2.wait(1);

    await skip_time(Time.Sec, 95400);

    let stake_tx3 = await staking_pool.stake(amount_to_stake );
    await stake_tx3.wait(1);


    await skip_time(Time.Sec, 77400);
    let stake_tx4 = await staking_pool.stake(amount_to_stake );
    await stake_tx4.wait(1);

    await skip_time(Time.Sec, 95400);
    let stake_tx5 = await staking_pool.stake(amount_to_stake );

    await stake_tx5.wait(1);


    await skip_time(Time.Sec, 77400);
    let stake_tx6 = await staking_pool.stake(amount_to_stake );

    await stake_tx6.wait(1);


    await skip_time(Time.Sec, 171800);
    let stake_tx7 = await staking_pool.stake(amount_to_stake );

    await stake_tx7.wait(1);


    // Get balance of staked tokens
    let balance = await staking_pool.balance();

    console.log("Staked balance is: ", balance);


    // Claim reward
    let reward_tx = await staking_pool.getReward();
    await reward_tx.wait(1);


    let reward_balance = await reward_token.balanceOf(signer.address);

    console.log("Reward balance is ", reward_balance);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

