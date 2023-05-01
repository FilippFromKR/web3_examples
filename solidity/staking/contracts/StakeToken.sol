pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
contract StakeToken is ERC20
{
    constructor () ERC20("Staking Token","ST")
    {
        _mint(msg.sender, 10000);

    }
    function mint()external
    {
        _mint(msg.sender,10000);
    }
}
