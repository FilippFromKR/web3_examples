import {expect} from "chai";
import {ethers} from "hardhat";
import {deploy} from "../scripts/common/deploy";
import {skip_time, Time, to_sec} from "../scripts/common/time";


describe("Computation", function () {

    async function reward(
        user_total_deposit: number,
        prev_reward_per_token: number,
        prev_rewards: number,
        last_update: number,
        duration: number,
        finish_in: number,
        total_rewards: number,
        total_supply: number) {
        let current_reward_per_token = await reward_per_token(prev_reward_per_token,
            last_update,
            duration,
            finish_in,
            total_rewards,
            total_supply);

        return user_total_deposit * (current_reward_per_token - prev_reward_per_token) + prev_rewards;
    }

    async function min_from_timstamp(finish_in_sec: number): Promise<number> {

        const timestamp = await current_time();
        let last_update = timestamp > finish_in_sec ? finish_in_sec : timestamp;
        return last_update;
    }

    async function current_time(): Promise<number> {
        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        return block.timestamp;
    }

    async function reward_per_token(
        prev_reward_per_token: number,
        last_update: number,
        duration: number,
        finish_in: number,
        total_rewards: number,
        total_supply: number
    ) {
        let reward_rate = total_rewards / duration;
        return prev_reward_per_token + ((await min_from_timstamp(finish_in) - last_update) * reward_rate / total_supply);
    }

    it('Taken reward should be like in the computation', async function () {

        let [owner] = await ethers.getSigners();

        let duration_in_sec = to_sec(Time.Week, 1);
        let finish_in = await current_time() + duration_in_sec;
        let reward_pool = 812;
        let amount_to_stake = 999;
        let user_rewards = 0;
        let user_staked = 0;
        let {staking_pool, staking_token, reward_token} = await deploy(duration_in_sec, reward_pool);

        let approve_tx = await staking_token.approve(staking_pool.address, amount_to_stake * 2);
        await approve_tx.wait(1);

        let last_update = await current_time();
        let stake_tx = await staking_pool.stake(amount_to_stake);
        user_staked += amount_to_stake;

        await skip_time(Time.Day, 1);
        stake_tx.wait(1);

        let prev_reward_per_token = await reward_per_token(reward_pool / duration_in_sec,
            last_update,
            duration_in_sec,
            finish_in,
            reward_pool,
            user_staked
        );
        let last_update2 = await current_time();

        let cur_reward = await reward(
            user_staked,
            prev_reward_per_token,
            user_rewards,
            last_update,
            duration_in_sec,
            finish_in,
            reward_pool,
            user_staked
        );
        user_rewards += cur_reward;


        let stake_tx2 = await staking_pool.stake(amount_to_stake);
        user_staked += amount_to_stake;

        await skip_time(Time.Day, 1);
        stake_tx2.wait(1);

        let prev_reward_per_token2 = await reward_per_token(prev_reward_per_token,
            last_update2,
            duration_in_sec,
            finish_in,
            reward_pool,
            user_staked
        );

        let cur_reward2 = await reward(
            user_staked,
            prev_reward_per_token2,
            user_rewards,
            last_update2,
            duration_in_sec,
            finish_in,
            reward_pool,
            user_staked
        );
        user_rewards += cur_reward;


        await staking_pool.getReward();

        let user_balance = await reward_token.balanceOf(owner.address);

        expect(user_balance).to.equal(ethers.BigNumber.from(Math.round(cur_reward2)));


    });
});