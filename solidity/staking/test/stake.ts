import {expect} from "chai";
import {ethers} from "hardhat";
import {deploy} from "../scripts/common/deploy";


describe("Stake/Unstake", function () {
    it('The user should have sufficient amount of tokens on the staking pool', async function () {

        let [owner] = await ethers.getSigners();

        let duration_in_sec = 30;
        let reward_pool = 50;
        let amount_to_stake = 30;
        let {staking_pool, staking_token, reward_token} = await deploy(duration_in_sec, reward_pool);

        let approve_tx = await staking_token.approve(staking_pool.address, 100);
        await approve_tx.wait(1);

        let stake_tx = await staking_pool.stake(amount_to_stake);
        stake_tx.wait(1);

        let user_balance = await staking_pool.balance();

        expect(user_balance).to.equal(ethers.BigNumber.from(amount_to_stake));


    });
    it('User should have less tokens on the staking pool after withdraw ', async function () {
        let [owner] = await ethers.getSigners();

        let duration_in_sec = 30;
        let reward_pool = 50;
        let amount_to_stake = 30;
        let amount_to_withdraw = 10;
        let {staking_pool, staking_token, reward_token} = await deploy(duration_in_sec, reward_pool);

        let approve_tx = await staking_token.approve(staking_pool.address, 100);
        await approve_tx.wait(1);

        let stake_tx = await staking_pool.stake(amount_to_stake);
        stake_tx.wait(1);

        let unstake_tx = await staking_pool.withdraw(amount_to_withdraw);
        unstake_tx.wait(1);

        let user_balance = await staking_pool.balance();

        expect(user_balance).to.equal(ethers.BigNumber.from(amount_to_stake - amount_to_withdraw));


    });

})