pragma solidity ^0.5.7;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../common/TimeGuard.sol";
import "../common/WhitelistOracle.sol";
import "./IEscrow.sol";

contract BasicEscrow is Ownable, Pausable, IEscrow, TimeGuard {
  using SafeMath for uint256;
  using Address for address;

  address payable public wallet;
  WhitelistOracle public whitelistOracle;

  bool public isTerminated = false;
  bool public isRefundEnabled = false;

  mapping (string => uint256) private _totalRaised;
  mapping (address => mapping (string => uint256)) _contributions;

  /**
   * @dev Throws if the refund is not enabled
   */
  modifier onlyWhenWithdrawOpen() {
    require(isRefundEnabled, "Refund is not enabled");
    _;
  }

  /**
   * @dev Throws if the given address is not whitelisted
   */
  modifier isWhitelisted(address _address) {
    require(whitelistOracle.isWhitelisted(_address), "Address is not whitelisted");
    _;
  }

  // events
  event Terminate();

  constructor(
    uint256 openingTime, 
    uint256 closingTime, 
    address payable _wallet,
    WhitelistOracle _whitelistOracle
  ) public 
    TimeGuard(openingTime, closingTime) 
  {
    require(_wallet != address(0), "Wallet must be a valid address");
    require(address(_whitelistOracle).isContract(), "Whitelist should be a contract address");

    wallet = _wallet;
    whitelistOracle = _whitelistOracle; 
  }

  /**
   * @dev Validation of an incoming contribution. Use require statements to revert state when conditions are not met.
   * @param contributionAmount The size of the contribution
   */
  function _preValidateContribution(uint256 contributionAmount)
    internal
    view
  {
    require(!isTerminated, "The escrow is finalized");
    require(!isRefundEnabled, "Refund is enabled");
    require(contributionAmount != 0, "Contribution amount should be greater than 0");
  }

  /**
   * @dev registers new contribution
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the 
   * sender of the message or any other address that has been whitelisted before.
   * @param value The size of the contribution
   * @param currency The contribution currency
   */
  function storeContribution(
    address beneficiary, 
    uint256 value, 
    string memory currency
  ) 
    internal
    whenNotPaused
    onlyWhileOpen
    isWhitelisted(beneficiary)
    returns (bool)
  {
    _preValidateContribution(value);

    // update the state
    _totalRaised[currency] = _totalRaised[currency].add(value);

    // update contribution
    _contributions[beneficiary][currency] = _contributions[beneficiary][currency].add(value);

    emit Contribution(beneficiary, value, currency, block.timestamp);
  }

  /**
   * @dev Gets the total amount reaised for the given currency
   * @param currency The contribution currency
   * @return the total amount raised
   */
  function getTotalRaised(string memory currency) 
    public 
    view 
    returns (uint256) 
  {
    return _totalRaised[currency];
  }

  /**
   * @dev Gets the value of the _contributions mapping.
   * @param beneficiary The beneficiary
   * @param currency The contribution currency
   * @return the total _contributions for a specific user
   */
  function getContribution(
    address beneficiary, 
    string memory currency
  ) public view returns (uint256) 
  {
    return _contributions[beneficiary][currency];
  }

  /**
   * @dev allows the owner to enable or disable the refund of the deposits
   * @param _isRefundEnabled Should the refund be enabled?
   */
  function changeRefundState(bool _isRefundEnabled) onlyOwner public {
    isRefundEnabled = _isRefundEnabled;
  }

  function withdraw(string memory currency) onlyWhenWithdrawOpen public {
    // Will be implemented in the child contracts
  }

  /**
   * @dev terminates the escrow so no more _contributions are allowed
   */
  function terminate() onlyOwner public {
    isTerminated = true;
    emit Terminate();
  }
}
