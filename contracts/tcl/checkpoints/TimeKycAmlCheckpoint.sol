pragma solidity ^0.5.7;

import "../ITransferCheckpoint.sol";
import "../ControllerRole.sol";
import "../../token/ERC1400/ICNG20.sol";


contract TimedKycAmlCheckpoint is ITransferCheckpoint, ControllerRole {
  mapping (address => KycData) _register;

  struct KycData {
    uint256 expiryDate;
    bool exists;
    bytes32 issuer;
  }

  // Events
  event RegisterUpdated(address account);

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   */
  constructor(address account)
    ControllerRole(account, "TIMED_KYC_AML_CHECKPOINT") 
    public {}

  /**
   * @dev Updates the registry with a new record
   * @param account The account that will be added to the kyc and aml register
   * @param expiryDate The date the KYC AML checks will expire
   * @param issuer The issuer name i.e. onfido
   */
  function updateRegister(
    address account, 
    uint256 expiryDate,
    bytes32  issuer
  ) 
    onlyController
    public 
  {
    require(account != address(0), "Address cannot be empty");
    require(expiryDate > block.timestamp, "Expiry date should be in the future");

    _register[account] = KycData(
      expiryDate,
      true,
      issuer
    );

    emit RegisterUpdated(account);
  }

  /**
   * @dev return the register for the given address
   */
  function readRegister(address account) 
    public
    view
    returns (uint256, bytes32)
  {
    KycData storage kycData =  _register[account];

    return (kycData.expiryDate, kycData.issuer);
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
    if(!_register[from].exists) {
      return (false, 0x50, "SENDER_KYC_NOT_FOUND");
    }

    if(!_register[to].exists) {
      return (false, 0x50, "RECIPIENT_KYC_NOT_FOUND");
    }

    if(block.timestamp > _register[from].expiryDate) {
      // we can probably change the hardcoded string to a hex value that we can get
      // the human readable message from.
      // 0x50 is the ERC16066 "Transfer Failed" status code
      return (false, 0x50, "SENDER_KYC_EXPIRED");
    } 

    if(block.timestamp > _register[to].expiryDate) {
      return (false, 0x50, "RECIPIENT_KYC_EXPIRED");
    } 

    // 0x51 is the ERC16066 "Transfer Successful" status code
    return (true, 0x51, "");
  }
}
