pragma solidity  ^0.5.7;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../../identity/IClaimRegistry.sol";
import "./ICNG20.sol";

/**
 * @title Implementation of IAccountBalance
 */
contract CNG20 is ERC20, ERC20Detailed, ICNG20 {
  using Address for address;

  mapping (bytes32 => uint256) private _balances;
  IClaimRegistry claimRegistry;

  constructor(
    string memory name,
    string memory symbol,
    uint8 decimals,
    IClaimRegistry claimRegistryAddress
  ) 
    public 
    ERC20Detailed(name, symbol, decimals)
  {
    require(address(claimRegistryAddress).isContract(), "ClaimRegistry should be a contract address");

    claimRegistry = IClaimRegistry(claimRegistryAddress);
  }

  function getAccountBalance(bytes32 accountId) 
    public 
    view
    returns (uint256) 
  {
    return _balances[accountId];
  }

  // Override ERC20 transfer related functions
  function _transfer(address from, address to, uint256 value) internal {
    bytes32 senderAccountId = claimRegistry.getAccountId(from);
    bytes32 recipientAccountId = claimRegistry.getAccountId(to);

    _balances[senderAccountId] = _balances[senderAccountId].sub(value);
    _balances[recipientAccountId] = _balances[recipientAccountId].add(value);

    return super._transfer(from, to, value);
  }

  function _mint(address account, uint256 value) internal {
    bytes32 accountId = claimRegistry.getAccountId(account);
    _balances[accountId] = _balances[accountId].add(value);

    super._mint(account, value);
  }

  function _burn(address account, uint256 value) internal {
    bytes32 accountId = claimRegistry.getAccountId(account);
    _balances[accountId] = _balances[accountId].sub(value);

    super._burn(account, value);
  }
}
