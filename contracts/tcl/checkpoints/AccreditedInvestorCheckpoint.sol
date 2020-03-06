pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../ITransferCheckpoint.sol";
import "../ControllerRole.sol";
import "./SPEVerifier.sol";
import "../../identity/IClaimRegistry.sol";
import "../../token/ERC1400/ICNG20.sol";


contract AccreditedInvestorCheckpoint is ITransferCheckpoint, SPEVerifier, ControllerRole {
  using Address for address;

  bytes32 constant constant _countryClaimKey = bytes32("countryOfResidence");
  bytes32 constant constant _accreditorInvestorClaimKey =  bytes32("isAccreditedInvestor"); 
  IClaimRegistry claimRegistry;

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   */
  constructor(address account, IClaimRegistry claimRegistryAddress)
    ControllerRole(account, "ACCREDITED_INVESTOR_CHECKPOINT")
    SPEVerifier(claimRegistryAddress)
    public
  {
    require(
      address(claimRegistryAddress).isContract(),
      "ClaimRegistry should be a contract address"
    );

    claimRegistry = IClaimRegistry(claimRegistryAddress);
  }

  function claimExpired(address account, bytes32 claimKey) public view returns (bool) {
    return claimRegistry.getClaim(account, claimKey).validTo < block.timestamp;
  }

  function claimEquals(address account, bytes32 claimKey, bytes32 value) private view returns (bool) {
    return claimRegistry.getClaim(account, claimKey).value == value;
  }

  function isAccreditedInvestor(address account)
    public
    view
    returns (bool)
  {
    return claimEquals(account, _accreditorInvestorClaimKey, bytes32("1"))
      && !claimExpired(account, _accreditorInvestorClaimKey)
      && !claimExpired(account, _countryClaimKey);
  }

  function isUsInvestor(address account)
    public
    view
    returns (bool)
  {
    return claimEquals(account, _countryClaimKey, bytes32("USA"));
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
    if (!isSPE(from) && isUsInvestor(from) && !isAccreditedInvestor(from)) {
      return (false, 0x50, "SENDER_IS_NOT_ACCREDITED");
    }
    if (!isSPE(to) && isUsInvestor(to) && !isAccreditedInvestor(to)) {
      return (false, 0x50, "RECIPIENT_IS_NOT_ACCREDITED");
    }

    return (true, 0x51, "");
  }
}
