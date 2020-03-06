pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../../identity/IClaimRegistry.sol";


contract SPEVerifier {
  using Address for address;

  IClaimRegistry public claimRegistry;

  /**
   * @dev Constructor
   * @param claimRegistryAddress The Claim Registry address
   */
  constructor(IClaimRegistry claimRegistryAddress) public {
    require(
      address(claimRegistryAddress).isContract(),
      "ClaimRegistry should be a contract address"
    );
    claimRegistry = IClaimRegistry(claimRegistryAddress);
  }

  function isSPE(address account)
    internal
    view
    returns (bool)
  {
    return account == address(0) || claimRegistry.getClaim(account, bytes32("isSPE")).value == bytes32("1");
  }
}
