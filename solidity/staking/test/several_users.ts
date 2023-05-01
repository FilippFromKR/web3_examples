import {expect} from "chai";
import {ethers} from "hardhat";
import {deploy} from "../scripts/common/deploy";
import {skip_time, Time, to_sec} from "../scripts/common/time";

describe("Users have the same amount of tokens during the same amount of time with the same total supply, " +
    "Thus, they should have, approximately, equal amount of rewards", function () {
    it('Bob and Alise stake their tokens', async function () {


        let [alice, bob] = await ethers.getSigners();

        let duration_in_sec = to_sec(Time.Day, 3);
        let reward_pool = 13037;
        let {staking_pool, staking_token, reward_token} = await deploy(duration_in_sec, reward_pool);

        let alice_tx = await staking_token.approve(staking_pool.address, 100);
        await alice_tx.wait(1);

        // @ts-ignore
        await staking_token.connect(bob).mint();
        let bob_tx = await staking_token.connect(bob).approve(staking_pool.address, 100);
        await bob_tx.wait(1);


        // Day 1, Alice stake 100 tokens
        await staking_pool.stake(100);
        await skip_time(Time.Day, 1);

        // Day 2, Bob stake 50 tokens, Alice withdraw 50 tokens
        await staking_pool.connect(bob).stake(50);
        await staking_pool.withdraw(50);
        await skip_time(Time.Day, 1);

        // Day 3, Bob stake 50 tokens,Alice withdraw 50 tokens
        await staking_pool.connect(bob).stake(50);
        await staking_pool.withdraw(50);
        await skip_time(Time.Day, 1);


        // Claim Bob and Alice
        await staking_pool.getReward();
        await staking_pool.connect(bob).getReward();

        let alice_balance = await reward_token.balanceOf(alice.address);
        let bob_balance = await reward_token.balanceOf(bob.address);

        console.log(`Bob: ${bob_balance}, Alice ${alice_balance}`);

        expect(alice_balance).to.be.closeTo(bob_balance, 5);

    });

    it('Bob,Alise and Charlie stake their tokens', async function () {

        let [alice, bob, charlie] = await ethers.getSigners();

        let duration_in_sec = to_sec(Time.Day, 3);
        let reward_pool = 78123;
        let {staking_pool, staking_token, reward_token} = await deploy(duration_in_sec, reward_pool);

        let alice_tx = await staking_token.approve(staking_pool.address, 1000);
        await alice_tx.wait(1);

        // @ts-ignore
        await staking_token.connect(bob).mint();
        let bob_tx = await staking_token.connect(bob).approve(staking_pool.address, 1000);
        await bob_tx.wait(1);

        // @ts-ignore
        await staking_token.connect(charlie).mint();
        let charlie_tx = await staking_token.connect(charlie).approve(staking_pool.address, 1000);
        await charlie_tx.wait(1);

        /// Day 1, Alice and Bob stake tokens
        await staking_pool.stake(200);
        await staking_pool.connect(bob).stake(100);
        await skip_time(Time.Day, 1);

        /// Day 2, Alice withdraw all tokens. Charlie stake and Bob stake
        await staking_pool.connect(bob).stake(100);
        await staking_pool.withdraw(200);
        await staking_pool.connect(charlie).stake(100);
        await skip_time(Time.Day, 1);

        /// Day 3, Bob withdraw all tokens. Charlie and Alice stake
        await staking_pool.connect(charlie).stake(100);
        await staking_pool.stake(100);
        await staking_pool.connect(bob).withdraw(200);
        await skip_time(Time.Day, 1);


        /// Get rewards
        await staking_pool.connect(bob).getReward();
        await staking_pool.connect(charlie).getReward();
        await staking_pool.getReward();


        let alice_balance = await reward_token.balanceOf(alice.address);
        let bob_balance = await reward_token.balanceOf(bob.address);
        let charlie_balance = await reward_token.balanceOf(charlie.address);

        console.log(`Bob: ${bob_balance}, Alice ${alice_balance}, Charlie ${charlie_balance}`);

        expect(alice_balance).to.be.closeTo(bob_balance, 5);
        expect(bob_balance).to.be.closeTo(charlie_balance, 5);

    });


});
