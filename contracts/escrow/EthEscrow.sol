pragma solidity ^0.5.7;

import "./BasicEscrow.sol";
import "../common/WhitelistOracle.sol";

contract EthEscrow is BasicEscrow {
  constructor(
    uint256 openingTime, 
    uint256 closingTime, 
    address payable wallet,
    WhitelistOracle whitelistOracle
  ) public BasicEscrow(
      openingTime, 
      closingTime, 
      wallet, 
      whitelistOracle
    ) 
  {}

  function() external payable {
    super.storeContribution(msg.sender, msg.value, "ETH");
  }

  /**
   * @dev Allows contributors to withdraw their contribution
   * The sender should be an address that has some contribution.
   * @param currency The contribution currency
   */
  function withdraw(string memory currency) onlyWhenWithdrawOpen public {
    address payable beneficiary = msg.sender;
    uint256 weiAmount = _contributions[beneficiary][currency];
    assert(address(this).balance >= weiAmount);

    _contributions[beneficiary][currency] = 0;
    beneficiary.transfer(weiAmount);

    emit Withdraw(beneficiary, weiAmount, currency);
  }

  /**
   * @dev terminates the escrow so no more contributions are allowed
   */
  function terminate() onlyOwner public {
    super.terminate();

    // transfer the funds to the wallet address
    wallet.transfer(address(this).balance);
  }
}
