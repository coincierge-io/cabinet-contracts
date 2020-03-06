pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract IssuerRole is Ownable {
  using Roles for Roles.Role;

  Roles.Role private _issuers;

    // Events
  event IssuerAdded(address indexed account);
  event IssuerRemoved(address indexed account);

  modifier onlyIssuer() {
    require(isIssuer(msg.sender), "Only issuer role");
    _;
  }

  constructor (address issuer) public {
    require(
      issuer != address(0),
      "Issuer should be a valid address"
    );

    _issuers.add(issuer);
    emit IssuerAdded(issuer);

    transferOwnership(issuer);
  }

  function isIssuer(address account) public view returns (bool) {
    return _issuers.has(account);
  }

  function addIssuer(address account) public onlyIssuer {
    _issuers.add(account);
    emit IssuerAdded(account);
  }

  function removeIssuer(address account) public onlyOwner {
    _removeIssuer(account);
  }

  function renounceIssuer() public {
    _removeIssuer(msg.sender);
  }

  function _removeIssuer(address issuer) private {
    require(owner() != issuer, "Owner cannot renounce himself");

    _issuers.remove(issuer);
    emit IssuerRemoved(issuer);
  }
}
