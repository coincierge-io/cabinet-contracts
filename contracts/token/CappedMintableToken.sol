pragma solidity  ^0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol';
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol';

contract CappedMintableToken is ERC20Capped, ERC20Burnable, ERC20Detailed, Ownable {
  constructor(string memory name, string memory symbol, uint256 cap)  
    ERC20Detailed(name, symbol, 18) 
    ERC20Capped(cap)
    public {}
}
