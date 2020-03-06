pragma solidity ^0.5.7;

/**
 * @title Escrow interface
 */
interface IEscrow {
  function changeRefundState(bool isRefundEnabled) external;
  function withdraw(string calldata currency) external;
  function terminate() external;
  function isClosed() external view returns (bool);

  event Contribution(address indexed beneficiary, uint256 value, string currency, uint256 time);
  event Withdraw(address indexed beneficiary, uint256 value, string currency);
}
