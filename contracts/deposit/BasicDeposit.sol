pragma solidity ^0.5.7;


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./IDeposit.sol";

contract BasicDeposit is Ownable, Pausable, IDeposit {
  using SafeMath for uint256;
  using Address for address;

  address payable public wallet;

  bool public isWithdrawEnabled = false;

  mapping (string => uint256) private _totalRaised;
  mapping (address => mapping (string => uint256)) internal _deposits;

  /**
   * @dev Throws if the refund is not enabled
   */
  modifier onlyWhenWithdrawOpen() {
    require(isWithdrawEnabled, "Refund is not enabled");
    _;
  }

  constructor(address payable _wallet) public {
    require(_wallet != address(0), "Wallet must be a valid address");

    wallet = _wallet;
  }

  /**
   * @dev Validation of an incoming deposit. Use require statements to revert state when conditions are not met.
   * @param depositAmount The size of the deposit
   */
  function _preValidateDeposit(uint256 depositAmount)
    internal
    view
  {
    require(!isWithdrawEnabled, "Refund is enabled");
    require(depositAmount != 0, "Deposit amount should be greater than 0");
  }

  /**
   * @dev registers new Deposit
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the
   * sender of the message or any other address that has been whitelisted before.
   * @param value The size of the Deposit
   * @param currency The Deposit currency
   */
  function storeDeposit(
    address beneficiary,
    uint256 value,
    string memory currency
  )
    internal
    whenNotPaused
    returns (bool)
  {
    _preValidateDeposit(value);

    // update the state
    _totalRaised[currency] = _totalRaised[currency].add(value);

    // update Deposit
    _deposits[beneficiary][currency] = _deposits[beneficiary][currency].add(value);

    emit Deposit(beneficiary, value, currency, block.timestamp);
  }

  /**
   * @dev Gets the total amount reaised for the given currency
   * @param currency The Deposit currency
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
   * @dev Gets the value of the deposits mapping.
   * @param beneficiary The beneficiary
   * @param currency The Deposit currency
   * @return the total deposits for a specific user
   */
  function getDeposit(
    address beneficiary, 
    string memory currency
  ) public view returns (uint256) 
  {
    return _deposits[beneficiary][currency];
  }

  /**
   * @dev allows the owner to enable or disable the refund of the deposits
   * @param _isWithdrawEnabled Should the refund be enabled?
   */
  function changeWithdrawState(bool _isWithdrawEnabled) onlyOwner public {
    isWithdrawEnabled = _isWithdrawEnabled;
  }

  function withdraw(string calldata _currency) onlyWhenWithdrawOpen external {
    // Will be implemented in the child contracts
  }

  function release(
    address beneficiary,
    uint256 value,
    string calldata currency
  ) onlyOwner external
  {
    // Will be implemented in the child contracts
  }
}
