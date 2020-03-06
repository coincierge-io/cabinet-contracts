pragma solidity  ^0.5.7;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

/**
 * @title Interface that extends the capabilities of ERC20 for retrieving balances
 */
contract ICNG20 is IERC20 {
  /**
   * @dev Returns the full balance of the given account id
   * @param accountId A valid account registered with the Claim Registry
   * @return The full balance of the given account including all it's associated Ethereum addresses
   */
  function getAccountBalance(bytes32 accountId) external view returns (uint256);
}
