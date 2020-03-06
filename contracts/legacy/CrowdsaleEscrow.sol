pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../common/TimeGuard.sol";
import "../common/WhitelistOracle.sol";
import "../token/CappedMintableToken.sol";
import "../distribution/TokenDistribution.sol";

/**
 * @title CrowdsaleEscrow
 * @notice This is the smart contract that will be used during the crowdfunding
 * process to register all the contribution records
 */
contract CrowdsaleEscrow is Ownable, Pausable, TimeGuard {
  using SafeMath for uint256;
  
  uint8 public constant decimals = 18;
  uint256 constant million = (10**6) * 10**uint256(decimals);
  uint256 public totalSupply;
  uint256 public tokenAvailableForSale;

  address payable public wallet;
  uint256 public weiRaised;
  bool public isFinalized = false;
  bool public isRefundEnabled = false;
  TokenDistribution public tokenDistribution;
  WhitelistOracle public whitelistOracle;
  CappedMintableToken public erc20;

  mapping (address => uint256) _contributions;

  /**
   * @dev Throws if the refund is not enabled
   */
  modifier onlyWhenWithdrawOpen() {
    require(isRefundEnabled, "Refund is not enables");
    _;
  }

  /**
   * @dev Throws if the given address is not whitelisted
   */
  modifier isWhitelisted(address addr) {
    require(whitelistOracle.isWhitelisted(addr), "Address is not whitelisted");
    _;
  }

  // events
  event LogContribution(address indexed beneficiary, uint256 value, uint256 time);
  event LogWithdraw(address indexed beneficiary, uint256 value);
  event LogComplete();

  constructor(
    string memory name, 
    string memory symbol,
    uint256 tokenAvailableForSaleInMillions,
    uint256 totalSupplyInMillions,
    uint256 openingTime, 
    uint256 closingTime, 
    address payable _wallet,
    address _whitelistOracle
  ) public 
    TimeGuard(openingTime, closingTime) 
  {
    require(_wallet != address(0), "Wallet must be a valid address");
    require(tokenAvailableForSaleInMillions <= totalSupplyInMillions, "Tokens available for sale should not exceed the total token supply");

    tokenAvailableForSale = tokenAvailableForSaleInMillions.mul(million);
    totalSupply = totalSupplyInMillions.mul(million);
    wallet = _wallet;
    erc20 = createTokenContract(name, symbol);
    tokenDistribution = new TokenDistribution(IERC20(erc20));
    whitelistOracle = WhitelistOracle(_whitelistOracle); 
  }

  function() external payable {
    storeContribution(msg.sender);
  }

  /**
   * @dev Deploys the ERC20 contract. Automatically called when this contract is deployed
   * @param name The name of the ERC20 token
   * @param symbol The Symbol of the ERC20 token
   * @return the capped mintable token address
   */
  function createTokenContract(string memory name, string memory symbol) 
    internal 
    returns (CappedMintableToken) 
  {
    return new CappedMintableToken(name, symbol, totalSupply); 
  }

  /**
   * @dev Validation of an incoming contribution. Use require statements to revert state when conditions are not met.
   * @param beneficiary Address saving the contribution
   * @param weiAmount Value in wei involved in the contribution
   */
  function _preValidateContribution(
    address beneficiary,
    uint256 weiAmount
  )
    internal
    view
  {
    require(!isFinalized, "Cannot call _preValidateContribution because the sale is finalized");
    require(!isRefundEnabled, "Cannot call _preValidateContribution because the refund is has been enabled");
    require(weiAmount != 0, "Contribution amount should be greater than 0");
  }

  /**
   * @dev registers new contribution
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the 
   * sender of the message or any other address that has been whitelisted before.
   */
  function storeContribution(address beneficiary) 
    private
    whenNotPaused
    onlyWhileOpen
    isWhitelisted(beneficiary)
  {
    uint256 weiAmount = msg.value;
    _preValidateContribution(beneficiary, weiAmount);

    // update the state
    weiRaised = weiRaised.add(weiAmount);
    _contributions[beneficiary] = _contributions[beneficiary].add(weiAmount);

    emit LogContribution(beneficiary, weiAmount, block.timestamp);
  }
  
  /**
   * @dev Gets the value of the _contributions mapping.
   * @return the total _contributions for a specific user.
   */
  function getContribution(address contributor) public view returns (uint256) {
    return _contributions[contributor];
  }

  /**
   * @dev allows the owner to enable or disable the refund of the deposits
   * @param _isRefundEnabled Should the refund be enabled?
   */
  function changeRefundState(bool _isRefundEnabled) onlyOwner public {
    isRefundEnabled = _isRefundEnabled;
  }

  /**
   * @dev Allows contributors to withdraw their contribution
   * The sender should be an address that has some contribution.
   */
  function withdraw() onlyWhenWithdrawOpen public {
    address payable beneficiary = msg.sender;
    uint256 weiAmount = _contributions[beneficiary];
    assert(address(this).balance >= weiAmount);

    _contributions[beneficiary] = 0;
    beneficiary.transfer(weiAmount);

    emit LogWithdraw(beneficiary, weiAmount);
  }

  /**
   * @dev Finalized the crowdsale process
   * @param tokens The amount of tokens to be minted and transfered to the Token distribution smart contract
   */
  function finalize(uint256 tokens) onlyOwner public {
    require(!isFinalized, "Cannot finalize bacause it's already been finalized");
    require(tokens <= tokenAvailableForSale, "token to be minted cannot be more that tokens available for sale");

    isFinalized = true;
    
    // 1. mint and trnafer to the token distribution contract
    erc20.mint(address(tokenDistribution), tokens);

    // 2. transfer the funds to the wallet address
    wallet.transfer(address(this).balance);

    // 3. transfer the ownership of erc20 to the owner of this contract
    erc20.addMinter(owner());

    // 4. transfer the token distribution back to the owner
    tokenDistribution.transferOwnership(owner());

    emit LogComplete();
  }
}
