pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../ITransferCheckpoint.sol";
import "../ControllerRole.sol";
import "./SPEVerifier.sol";
import "../../identity/IClaimRegistry.sol";
import "../../token/ERC1400/ICNG20.sol";

contract KycAmlCheckpoint is ITransferCheckpoint, SPEVerifier, ControllerRole {
  using Address for address;

  IClaimRegistry claimRegistry;

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   */
  constructor(address account, IClaimRegistry claimRegistryAddress)
    ControllerRole(account, "KYC_AML_CHECKPOINT")
    SPEVerifier(claimRegistryAddress)
    public 
  {
    require(address(claimRegistryAddress).isContract(), "ClaimRegistry should be a contract address");

    claimRegistry = IClaimRegistry(claimRegistryAddress);
  }

  function isKycAmlValid(address account)
    private
    view
    returns (bool)
  {
    return (
      (claimRegistry.getClaim(account, bytes32("kycAml")).value == bytes32("1")) && 
      (claimRegistry.getClaim(account, bytes32("kycAml")).validTo >= block.timestamp)
    );
  }
  /**
   * @dev Checks if the given account is registed
   * @param account The account to be checked
   */
  function isRegistered(address account)
    public
    view
    returns (bool)
  {
    return (isKycAmlValid(account));
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

    if(!isSPE(from) && !isKycAmlValid(from)) {
      return (false, 0x50, "SENDER_KYC_NOT_VALID");
    }
    if(!isSPE(to) && !isKycAmlValid(to)) {
      return (false, 0x50, "RECIPIENT_KYC_NOT_VALID");
    }

    // 0x51 is the ERC16066 "Transfer Successful" status code
    return (true, 0x51, "");
  }
}
