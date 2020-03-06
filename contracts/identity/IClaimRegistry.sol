pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

interface IClaimRegistry {
  struct Claim {
    bytes32 value;
    address issuer;
    uint256 validTo;
    bytes32 provider;
    bytes providerProof;
  }

  /**
   * @dev Add a claim to the given accountId
   * @param accountId The account id
   * @param key The claim key
   * @param claim The claim 
   */
  function setClaim(bytes32 accountId, bytes32 key, Claim calldata claim) external;

  /**
   * @dev Add the given claims to the given corresponding accounts
   * @param accountIds The list of account ids
   * @param keys The list of claim keys
   * @param claims The list of claims
   */
  function setClaims(bytes32[] calldata accountIds, bytes32[] calldata keys, Claim[] calldata claims) external;

  /**
   * @dev Returns the claim with the given key
   * @param account The addess we want to read the claim for
   * @param key The claim key
   * @return claim value
   */
  function getClaim(address account, bytes32 key) view external returns(Claim memory);

  /**
   * @dev Removes the claim with the given key
   * @param accountId The account id
   * @param key The claim key
   */
  function removeClaim(bytes32 accountId, bytes32 key) external;

  /**
   * @dev Removes the given list of claims
   * @param accountIds The list of account ids
   * @param keys The list of claim keys
   */
  function removeClaims(bytes32[] calldata accountIds, bytes32[] calldata keys) external;

  /**
   * @dev Registers a new address for the given account id
   * @param accountId The new account id
   * @param account The new account address
   */
  function registerAccount(bytes32 accountId, address account) external;

  /**
   * @dev unregisters a new address for the given account id
   * @param account The account address
   */
  function unregisterAccount(address account) external;

  /**
   * @dev Returns the account id for the given account
   * @param account The new account address
   * @return accountId
   */
  function getAccountId(address account) view external returns(bytes32);

  /**
   * @dev Registers a new address for the given account and sets a claim for it
   * @param accountId The account id
   * @param account The new address
   * @param key The claim key
   * @param claim The claim
   */
  function setClaimAndRegisterAccount(bytes32 accountId, address account, bytes32 key, Claim calldata claim) external;
}