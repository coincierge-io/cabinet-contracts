pragma solidity ^0.5.7;

import "../token/ERC1400/ICNG20.sol";

/**
 * @title IPostTransfer interface
 */
interface IPostTransfer {
  /**
   * @dev A useful function that will be invoked after a successful token transfer. 
   *      The purpose of this function is to update the internal state of each checkpoint as needed
   * @param from The sender address
   * @param to The recipient address
   * @param amount The transfer amount
   * @param data Arbitrary piece of data that can be useful during the checks
   * @param token The erc20 contract
   */
  function postTransfer(
    address from, 
    address to, 
    uint256 amount, 
    bytes calldata data,
    ICNG20 token
  ) external;
}
