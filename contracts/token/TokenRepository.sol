pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract TokenRepository is Ownable, Pausable {
  using Address for address;

  struct TokenData {
    IERC20 erc20;
    bool exists;
  }

  mapping (string => TokenData) private _tokens;
  string[] public tokenList;
  
  /**
   * @dev Registers a new erc20 token address
   * @param tokenName The name of the erc20 token
   * @param erc20 The erc20 token address
   * @return true if the token is succesfully added
   */
  function registerToken(string memory tokenName, IERC20 erc20) 
    public 
    onlyOwner 
    whenNotPaused
    returns (bool) 
  {
    require(!_tokens[tokenName].exists,  "Cannot override the address of a previously added currency");
    require(address(erc20).isContract(), "erc20 should be a contract address");

    _tokens[tokenName] = TokenData(erc20, true);
    tokenList.push(tokenName);
  }

  /**
   * @dev Returns the erc20 address of the given token
   * @param tokenName The name of the erc20 token
   * @return the contract address
   */
  function getTokenAddress(string memory tokenName) 
    public 
    view 
    returns (IERC20) 
  {
    return _tokens[tokenName].erc20;
  }
}
