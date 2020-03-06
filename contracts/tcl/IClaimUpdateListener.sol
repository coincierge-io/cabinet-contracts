pragma solidity ^0.5.7;

/**
 * @title IClaimUpdateListener interface
 */
interface IClaimUpdateListener {
  /**
   * @dev A useful function that will be invoked after a successful claim update
   *      The purpose of this function is to update the internal state of each checkpoint as needed
   * @param claimKey The key of the claim that was updated
   * @param oldValue The old claim value
   * @param newValue The new claim value
   */
  function onClaimUpdate(
    bytes32 claimKey, 
    bytes32 oldValue,
    bytes32 newValue
  ) external;
}
