pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract RewardToken is ERC20
{
    constructor () ERC20("Reward Token", "RT")
    {

    }
    function mint(address account, uint256 amount) external
    {
        _mint(account ,amount);
    }
}
