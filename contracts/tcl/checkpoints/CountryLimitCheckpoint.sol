pragma solidity ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165.sol";
import "../ITransferCheckpoint.sol";
import "../IPostTransfer.sol";
import "../ControllerRole.sol";
import "./SPEVerifier.sol";
import "../../identity/IClaimRegistry.sol";
import "../../token/ERC1400/ICNG20.sol";


contract CountryLimitCheckpoint is ITransferCheckpoint, IPostTransfer, SPEVerifier, ControllerRole, ERC165 {
  using SafeMath for uint256;
  using Address for address;

  bytes32 private constant _countryClaim = bytes32("countryOfResidence");
  mapping (bytes32 => uint256) private _limits;
  mapping (bytes32 => uint256) private _register;

  IClaimRegistry public claimRegistry;

  event LimitsUpdated();

  /**
   * @dev Constructor
   * @param account The account that will be main controller
   * @param _claimRegistry The claim registry address
   */
  constructor(
    address account,
    IClaimRegistry _claimRegistry
  )
    ControllerRole(account, "COUNTRY_LIMIT_CHECKPOINT")
    SPEVerifier(_claimRegistry)
    public
  {
    require(
      address(_claimRegistry).isContract(),
      "ClaimRegistry should be a contract address"
    );

    claimRegistry = _claimRegistry;
    _registerInterface(this.postTransfer.selector);
  }

  function addLimits(
    bytes32[] memory countries,
    uint256[] memory limits
  )
    public
    onlyController
  {
    require(countries.length == limits.length, "Array length mismatch");

    for (uint256 i = 0; i < countries.length; i++) {
      _limits[countries[i]] = limits[i];
    }

    emit LimitsUpdated();
  }

  function getLimit(bytes32 country)
    public
    view
    returns (uint256)
  {
    return _limits[country];
  }

  function getInvestorCount(bytes32 country)
    public
    view
    returns (uint256)
  {
    return _register[country];
  }

  function claimExpired(address account, bytes32 claimKey) public view returns (bool) {
    return claimRegistry.getClaim(account, claimKey).validTo < block.timestamp;
  }

  function hasExceededLimit(
    address from,
    address to, 
    uint256 amount, 
    ICNG20 token
  ) 
    public 
    view 
    returns (bool) 
  {
    bytes32 senderCountry = claimRegistry.getClaim(from, _countryClaim).value;
    bytes32 senderAccountId = claimRegistry.getAccountId(from);
    bytes32 recipientCountry = claimRegistry.getClaim(to, _countryClaim).value;
    bytes32 recipientAccountId = claimRegistry.getAccountId(to);
    uint256 investorCount = _register[recipientCountry];
  
    // if it's a new investor account then the limit will exceed after the transfer happens
    // thus we need to count this information in.
    if(token.getAccountBalance(recipientAccountId) == 0) {
      investorCount = investorCount.add(1);
    }

    // check if the sender and recipient is from the same country 
    // and if sender wants to tranfer his entire balance
    if(senderCountry == recipientCountry 
      && token.getAccountBalance(senderAccountId) >= amount
      && token.getAccountBalance(senderAccountId).sub(amount) == 0) { 
        investorCount = investorCount.sub(1);
    }

    return investorCount > _limits[recipientCountry] 
      || claimExpired(to, _countryClaim);
  }

  function canTransfer(
    address from,
    address to,
    uint256 amount,
    bytes memory data,
    ICNG20 token
  )
    public
    view
    returns (bool, byte, bytes32)
  {
    if(!isSPE(to) && hasExceededLimit(from, to, amount, token)) {
      return (false, 0x50, "RECIPIENT_COUNTRY_LIMIT");
    }

    return (true, 0x51, "");
  }

  function postTransfer(
    address from,
    address to,
    uint256 amount,
    bytes memory data,
    ICNG20 token
  )
    public
    onlyController
  {
    bytes32 senderCountry = claimRegistry.getClaim(from, _countryClaim).value;
    bytes32 senderAccountId = claimRegistry.getAccountId(from);
    bytes32 recipientCountry = claimRegistry.getClaim(to, _countryClaim).value;
    bytes32 recipientAccountId = claimRegistry.getAccountId(to);

    if(!isSPE(from) && token.getAccountBalance(senderAccountId) == 0 && _register[senderCountry] != 0) {
      _register[senderCountry] = _register[senderCountry].sub(1);
    }
    if(!isSPE(to) && token.getAccountBalance(recipientAccountId) == amount) {
      _register[recipientCountry] = _register[recipientCountry].add(1);
    }
  }
}
