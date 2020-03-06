pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "./IClaimRegistry.sol";
import "../tcl/ControllerRole.sol";
import "../token/roles/IssuerRole.sol";


contract ClaimRegistry is IClaimRegistry, ControllerRole {
  // accountId => key => Claim
  // accountId = keccak256(firsName||lastName||address)
  mapping (bytes32 => mapping(bytes32 => Claim)) private _claims;

  // We need to associate addresses with user ids, this will help us
  // have multiple addresses for each user and also retrieve the relevant
  // claims either using the userid or one of the addresses
  mapping (address => bytes32) private _accounts;

    // events
  event ClaimSet(bytes32 accountId, bytes32 key, address issuer);
  event ClaimRemoved(bytes32 accountId, bytes32 key, address issuer);
  event AccountRegistered(bytes32 accountId, address account);
  event AccountUnregistered(bytes32 accountId, address account);

  /**
   * @dev Constructor
   * @param controller The account that will be main controller
   */
  constructor (address controller)
    ControllerRole(controller, "CLAIM_REGISTRY_CONTROLLER")
    public
  {}

  /**
   * @dev Only issuer should add new controllers, unlike the default
   * behaviour of the ControllerRole
   */
  function addController(address account) public onlyOwner {
    super.addController(account);
  }

  /**
   * Will check if a potential override is allowed
   */
  function _checkOverride(
    bytes32 accountId,
    bytes32 key
  )
    private
    view
    returns(bool)
  {
    Claim memory c = _claims[accountId][key];

    return c.issuer == address(0)
      || c.issuer == msg.sender
      || c.validTo < block.timestamp;
  }

  function setClaim(
    bytes32 accountId,
    bytes32 key,
    Claim memory claim
  )
    public
    onlyController
  {
    require(claim.issuer == msg.sender, "Issuer mismatch");
    require(_checkOverride(accountId, key), "Cannot override claim");
    require(claim.validTo > block.timestamp, "Claim expiry date is in the past");

    _claims[accountId][key] = claim;

    emit ClaimSet(accountId, key, claim.issuer);
  }

  function setClaims(
    bytes32[] memory accountIds,
    bytes32[] memory keys,
    Claim[] memory claims
  )
    public
    onlyController
  {
    require(accountIds.length == keys.length && keys.length == claims.length, "Array length mismatch");
    for (uint256 i = 0; i < accountIds.length; i++) {
      setClaim(accountIds[i], keys[i], claims[i]);
    }
  }

  function getClaim(
    address account,
    bytes32 key
  )
    public
    view
    returns(Claim memory)
  {
    return _claims[_accounts[account]][key];
  }

  function getClaimByAccountId(
    bytes32 accountId,
    bytes32 key
  )
    public
    view
    returns(Claim memory)
  {
    return _claims[accountId][key];
  }

  function removeClaim(
    bytes32 accountId,
    bytes32 key
  )
    public
    onlyController
  {
    emit ClaimRemoved(accountId, key, _claims[accountId][key].issuer);
    delete _claims[accountId][key];
  }

  function removeClaims(
    bytes32[] memory accountIds,
    bytes32[] memory keys
  )
    public
    onlyController
  {
    require(accountIds.length == keys.length, "Array length mismatch");
    
    for (uint256 i = 0; i < accountIds.length; i++) {
      removeClaim(accountIds[i], keys[i]);
    }
  }

  function registerAccount(
    bytes32 accountId,
    address account
  )
    public
    onlyController
  {
    require(_accounts[account] == "", "Cannot override account");
    _accounts[account] = accountId;

    emit AccountRegistered(accountId, account);
  }

  function setClaimAndRegisterAccount(
    bytes32 accountId,
    address account,
    bytes32 key,
    Claim memory claim
  )
    public
    onlyController
  {
    registerAccount(accountId, account);
    setClaim(accountId, key, claim);
  }

  function setClaimsAndRegisterAccount(
    bytes32 accountId,
    address account,
    bytes32[] memory keys,
    Claim[] memory claims
  )
    public
    onlyController
  {
    require(keys.length == claims.length, "Array length mismatch");

    registerAccount(accountId, account);

    for (uint256 i = 0; i < keys.length; i++) {
      setClaim(accountId, keys[i], claims[i]);
    }
  }

  function registerAccounts(
    bytes32 accountId,
    address[] memory accounts
  )
    public
    onlyController
  {
    for (uint256 i = 0; i < accounts.length; i++) {
      registerAccount(accountId, accounts[i]);
    }
  }

  function unregisterAccount(address account)
    public
    onlyController
  {
    bytes32 accountId = _accounts[account];
    delete _accounts[account];

    emit AccountUnregistered(accountId, account);
  }

  function unregisterAccounts(
    address[] memory accounts
  )
    public
    onlyController
  {
    for (uint256 i = 0; i < accounts.length; i++) {
      unregisterAccount(accounts[i]);
    }
  }

  function getAccountId(address account)
    public
    view
    returns(bytes32)
  {
    return _accounts[account];
  }
}
