pragma solidity ^0.5.7;

import "../token/ERC1400/ICNG20.sol";

/**
 * @title ITransferCheckpoint interface
 */
interface ITransferCheckpoint {
  /**
   * @dev The main function that will decide if a transfer can happen
   * @param from The sender address
   * @param to The recipient address
   * @param amount The transfer amount
   * @param data Arbitrary piece of data that can be useful during the checks
   * @param token The erc20 contract
   * @return (bool, byte, bytes32) A success bool, a ESC code and an internal code in case of error
   */
  function canTransfer(
    address from, 
    address to, 
    uint256 amount, 
    bytes calldata data,
    ICNG20 token
  ) external view returns (bool, byte, bytes32);
}
