pragma solidity ^0.5.7;

import "../ITransferCheckpoint.sol";
import "../ControllerRole.sol";
import "../../token/ERC1400/ICNG20.sol";

contract BlockedAccountCheckpoint is ITransferCheckpoint, ControllerRole {
  mapping (address => bool) private _blocked;

  // Events
  event AccountBlocked(address account);
  event AccountUnblocked(address account);

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   */
  constructor(address account)
    ControllerRole(account, "BLOCKED_ACCOUNT_CHECKPOINT") 
    public {}

  /**
   * @dev Blocks the given account
   * @param account The account that will be blocked
   */
  function blockAccount(address account) 
    onlyController
    public 
  {
    require(account != address(0), "Address cannot be empty");
    _blocked[account] = true;

    emit AccountBlocked(account);
  }

  /**
   * @dev Unblocks the given account
   * @param account The account that will be unblocked
   */
  function unblockAccount(address account) 
    onlyController
    public 
  {
    require(account != address(0), "Address cannot be empty");
    _blocked[account] = false;

    emit AccountUnblocked(account);
  }

  /** 
   * @dev Checks if the given account is blocked
   * @param account The account to be checked
   */
  function isBlocked(address account) 
    public
    view
    returns (bool)
  {
    return _blocked[account];
  }

  function canTransfer(
    address from, 
    address to, 
    uint256 amount,
    bytes memory data,
    ICNG20 token
  ) 
    public 
    view 
    returns (bool, byte, bytes32)
  {
    if(_blocked[from]) {
      return (false, 0x50, "SENDER_BLOCKED");
    }

    if(_blocked[to]) {
      return (false, 0x50, "RECIPIENT_BLOCKED");
    }

    // 0x51 is the ERC16066 "Transfer Successful" status code
    return (true, 0x51, "");
  }
}
