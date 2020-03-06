pragma solidity ^0.5.7;

import "./ITransferCheckpoint.sol";
import "../token/ERC1400/ICNG20.sol";

/**
 * @title ITclRepository interface
 */
interface ITclRepository {
  /**
   * @dev Adds a new transfer checkpoint
   * @param token The token address
   * @param checkpointCode The string code of the transfer checkpoint
   * @param transferCheckpoint The transfer checkpoint contract
   */
  function addCheckpoint(
    ICNG20 token,
    uint256  checkpointCode,
    ITransferCheckpoint transferCheckpoint
  ) external;

  /**
   * @dev Adds the given list of checkpoints
   * @param token The token address
   * @param checkpointCodes The list of string codes of the transfer checkpoints
   * @param transferCheckpoints The list of transfer checkpoint contracts
   */
  function addCheckpoints(
    ICNG20 token,
    uint256[] calldata checkpointCodes,
    ITransferCheckpoint[] calldata transferCheckpoints
  ) external;

  /**
   * @dev Removes an existing transfer checkpoint
   * @param token The token address
   * @param checkpointCode The string code of the transfer checkpoint
   */
  function removeCheckpoint(ICNG20 token, uint256 checkpointCode) external;

  /**
   * @dev Removes the given list of checkpoints
   * @param token The token address
   * @param checkpointCodes The list of string codes of the transfer checkpoints
   */
  function removeCheckpoints(ICNG20 token, uint256[] calldata checkpointCodes) external;

  /**
   * @dev Returns the transfer checkpoint associated with the given code
   * @param token The token address
   * @param checkpointCode The string code of the transfer checkpoint
   * @return The Transfer checkpoint
   */
  function getCheckpoint(ICNG20 token, uint256 checkpointCode) external view returns(ITransferCheckpoint);

  /**
   * @dev Deploys the given checpoint code using the raw data
   * @param token The token address
   * @param checkpointCode The string code of the transfer checkpoint
   * @param code The raw data for the deployment
   * @param salt Arbitraty value that is used in create2
   */
  function deployCheckpoint(
    ICNG20 token, 
    uint256 checkpointCode, 
    bytes calldata code,
    bytes32 salt
  ) external returns(ITransferCheckpoint);
}
