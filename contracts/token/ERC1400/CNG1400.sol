pragma solidity  ^0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../../identity/IClaimRegistry.sol";
import "../../tcl/TclController.sol";
import "../roles/IssuerRole.sol";
import "./CNG20.sol";
import "./ERC1594.sol";
import "./ERC1644.sol";


contract CNG1400 is CNG20, ERC1594, ERC1644, IssuerRole {
  using Address for address;

  TclController public tclController;

  constructor(
    TclController _tclController,
    IClaimRegistry claimRegistry,
    address issuer,
    string memory name,
    string memory symbol,
    uint8 decimals
  )
    public
    CNG20(name, symbol, decimals, claimRegistry)
    ERC1594(_tclController)
    ERC1644(_tclController)
    IssuerRole(issuer)
  {
    tclController = _tclController;
  }

  /**
    * @dev End token issuance period permanently.
    */
  function finishIssuance() public onlyIssuer {
    super.finishIssuance();
  }

  function issue(
    address account,
    uint256 value,
    bytes memory data
  )
    public
    onlyIssuer
  {
    super.issue(account, value, data);
  }

  function setIsControllable(bool isControllable) public onlyIssuer {
    super.setIsControllable(isControllable);
  }
}
