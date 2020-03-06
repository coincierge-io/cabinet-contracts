pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../ITransferCheckpoint.sol";
import "./SPEVerifier.sol";
import "../../identity/IClaimRegistry.sol";
import "../ControllerRole.sol";
import "../../token/ERC1400/ICNG20.sol";

contract InvestorLimitCheckpoint is ITransferCheckpoint, SPEVerifier, ControllerRole {
  using SafeMath for uint256;
  using Address for address;

  uint256 public investorLimit;

  event LimitUpdated();

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   */
  constructor(
    address account,
    IClaimRegistry claimRegistry
  )
    ControllerRole(account, "INVESTOR_LIMIT_CHECKPOINT")
    SPEVerifier(claimRegistry)
    public
  {}

  function setLimit(uint256 limit)
    public
    onlyController
  {
    investorLimit = limit;
    emit LimitUpdated();
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
    uint256 balance = token.balanceOf(to);

    if (!isSPE(to) && balance.add(amount) > investorLimit) {
      return (false, 0x50, "INVESTOR_BALANCE_LIMIT");
    }

    return (true, 0x51, "");
  }
}
