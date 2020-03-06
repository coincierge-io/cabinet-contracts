pragma solidity ^0.5.7;

/**
 * @title Deposit interface
 */
interface IDeposit {
  function changeWithdrawState(bool isWithdrawEnabled) external;
  function withdraw(string calldata currency) external;
  function release(address beneficiary, uint256 value, string calldata currency) external;

  event Deposit(address indexed beneficiary, uint256 value, string currency, uint256 time);
  event Withdraw(address indexed beneficiary, uint256 value, string currency);
  event Release(address indexed beneficiary, uint256 value, string currency);
}
