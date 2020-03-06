pragma solidity  ^0.5.7;

import "./ERC1400/CNG1400.sol";
import "../identity/IClaimRegistry.sol";
import "../tcl/TclController.sol";


contract CNG1400TokenFactory {
  function deploy(
    TclController tclController,
    IClaimRegistry claimRegistry,
    address issuer,
    string memory name,
    string memory symbol,
    uint8 decimals
  ) 
    public returns(address)
  {
    CNG1400 newToken = new CNG1400(
      tclController,
      claimRegistry,
      issuer,
      name,
      symbol,
      decimals
    );

    return address(newToken);
  }
}
