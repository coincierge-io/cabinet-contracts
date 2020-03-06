pragma solidity ^0.5.7;

import "./BasicDeposit.sol";


contract EthDeposit is BasicDeposit {
  constructor(
    address payable wallet
  ) public BasicDeposit(wallet) {}

  function() external payable {
    super.storeDeposit(msg.sender, msg.value, "ETH");
  }

  /**
   * @dev Allows investors to withdraw their deposit
   * The sender should be an address that has some deposit.
   * @param currency The deposit currency
   */
  function withdraw(string calldata currency) onlyWhenWithdrawOpen external {
    address payable beneficiary = msg.sender;
    uint256 weiAmount = _deposits[beneficiary][currency];
    require(address(this).balance >= weiAmount, "Not enough balance");

    _deposits[beneficiary][currency] = 0;
    beneficiary.transfer(weiAmount);

    emit Withdraw(beneficiary, weiAmount, currency);
  }

  /**
   * @dev Allows the owner to release part or all of the investor's deposits
   * The sender should be the ownewr of the contract.
   * @param beneficiary The investor whos deposit will be released
   * @param value The amount that will be released
   * @param currency The deposit's currency
   */
  function release(
    address beneficiary,
    uint256 value,
    string calldata currency
  ) external onlyOwner
  {
    uint256 accountBalance = _deposits[beneficiary][currency];
    require(accountBalance >= value, "Cannot release more than the account's balance");

    wallet.transfer(value);
    _deposits[beneficiary][currency] = _deposits[beneficiary][currency].sub(value);
    emit Release(beneficiary, value, currency);
  }
}
