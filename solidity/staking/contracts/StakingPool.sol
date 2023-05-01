pragma solidity ^0.8.0;

import "../libraries/Math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingPool
{
    using SaveMath for uint256;

    IERC20 public reward_token;
    IERC20 public staking_token;
    uint256 public periodFinish;
    uint256 public total_rewards;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 private totalSupply;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) private balances;

    constructor(address _reward_token, address _staking_token, uint256 _duration, uint256 _total_rewards)
    {
        reward_token = IERC20(_reward_token);
        staking_token = IERC20(_staking_token);
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(_duration);
        total_rewards = _total_rewards;
        rewardRate = total_rewards.mul(1e18).div(_duration);
    }

    function lastTimeRewardApplicable() public view returns (uint256)
    {
        return block.timestamp > periodFinish ? periodFinish : block.timestamp;
    }


    function rewardPerToken() public view returns (uint256)
    {
        if (totalSupply == 0)
        {
            return rewardPerTokenStored;

        }
        return rewardPerTokenStored.add(
            lastTimeRewardApplicable()
            .sub(lastUpdateTime)
            .mul(rewardRate)
            .div(totalSupply)
        );

    }

    function balance() external view returns (uint256)
    {
        return balances[msg.sender];
    }

    function earned(address account) public view returns (uint256)
    {
        return balances[account].mul(
            rewardPerTokenStored
            .sub(userRewardPerTokenPaid[account]
            ))
        .add(rewards[account]);

    }


    function stake(uint256 amount) external updateReward(msg.sender)
    {
        require(amount > 0, "Cannot stake 0");
        totalSupply += amount;
        balances[msg.sender] = balances[msg.sender].add(amount);
        staking_token.transferFrom(msg.sender, address(this), amount);


    }

    function withdraw(uint256 amount) public updateReward(msg.sender)
    {
        require(amount > 0, "cannot withdraw 0");
        balances[msg.sender] = balances[msg.sender].sub(amount);
        totalSupply = totalSupply.sub(amount);

        staking_token.transfer(msg.sender, amount);

    }

    function reward() external view returns (uint256)
    {
        return rewards[msg.sender];
    }

    function getReward() public updateReward(msg.sender)
    {
        uint256 reward = rewards[msg.sender];

        if (reward > 0)
        {
            rewards[msg.sender] = 0;
            reward_token.transfer(msg.sender, reward.div(1e18));
        }

    }

    function exit() external {
        withdraw(balances[msg.sender]);
        getReward();
    }




    modifier updateReward(address account)
    {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();

        require(account != address(0), "0 account");
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;

        _;

    }

}
