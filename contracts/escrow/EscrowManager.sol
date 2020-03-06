pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Capped.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../token/TokenRepository.sol";
import "../common/WhitelistOracle.sol";
import "../token/CappedMintableToken.sol";
import "../distribution/TokenDistribution.sol";
import "./EthEscrow.sol";
import "./StablecoinEscrow.sol";
import "./IEscrow.sol";

contract EscrowManager is Ownable, Pausable {
  using SafeMath for uint256;
  using Address for address;
  
  uint8 public constant decimals = 18;
  uint256 constant million = (10**6) * 10**uint256(decimals);
  uint256 public totalSupply;
  uint256 public tokenAvailableForSale;

  address payable public wallet;
  TokenDistribution public tokenDistribution;
  bool public isFinalized = false;

  CappedMintableToken public erc20;
  IEscrow public ethEscrow;
  IEscrow public stablecoinEscrow;
  
  /**
   * @dev Makes sure that a function can be called only by the owner
   * unless the closing time has expired
   */
  modifier OnlyOwnerBeforeClosingTime {
    if(
      !ethEscrow.isClosed() &&
      !stablecoinEscrow.isClosed()
    ) {
      require(msg.sender == owner(), "Non-owners can invoke after the closing time");
    }

    _;
  }

  // events
  event Complete();

  constructor(
    string memory name, 
    string memory symbol,
    uint256 _tokenAvailableForSaleInMillions,
    uint256 _totalSupplyInMillions,
    uint256 _openingTime, 
    uint256 _closingTime, 
    address payable _wallet,
    WhitelistOracle _whitelistOracle,
    TokenRepository _tokenRepository
  ) public 
  {
    require(_wallet != address(0), "Wallet must be a valid address");
    require(_tokenAvailableForSaleInMillions <= _totalSupplyInMillions, "Tokens available for sale should not exceed the total token supply");
    require(address(_whitelistOracle).isContract(), "Whitelist should be a contract address");
    require(address(_tokenRepository).isContract(), "Token repository should be a contract address");

    tokenAvailableForSale = _tokenAvailableForSaleInMillions.mul(million);
    totalSupply = _totalSupplyInMillions.mul(million);
    wallet = _wallet;
    erc20 = createTokenContract(name, symbol);
    tokenDistribution = new TokenDistribution(IERC20(erc20));
    
    // deploy escrow contracts
    ethEscrow = new EthEscrow(
      _openingTime,
      _closingTime,
      _wallet,
      _whitelistOracle
    );

    stablecoinEscrow = new StablecoinEscrow(
      _openingTime,
      _closingTime,
      _wallet,
      _whitelistOracle,
      _tokenRepository
    );
  }

  /**
   * @dev Deploys the ERC20 contract. Automatically called when this contract is deployed
   * @param name The name of the ERC20 token
   * @param symbol The Symbol of the ERC20 token
   * @return the capped mintable token address
   */
  function createTokenContract(string memory name, string memory symbol) 
    private 
    returns (CappedMintableToken) 
  {
    return new CappedMintableToken(name, symbol, totalSupply); 
  }

  /**
   * @dev allows the owner to enable or disable the refund of the deposits
   * @param isRefundEnabled Should the refund be enabled?
   */
  function changeRefundState(bool isRefundEnabled) 
    OnlyOwnerBeforeClosingTime 
    public 
  {
    ethEscrow.changeRefundState(isRefundEnabled);
    stablecoinEscrow.changeRefundState(isRefundEnabled);
  }

  /**
   * @dev Finalized the crowdsale process
   * @param tokens The amount of tokens to be minted and transfered to the Token distribution smart contract
   */
  function finalize(uint256 tokens) 
    OnlyOwnerBeforeClosingTime 
    public 
  {
    require(!isFinalized, "Cannot finalize bacause it's already been finalized");
    require(tokens <= tokenAvailableForSale, "token to be minted cannot be more that tokens available for sale");

    isFinalized = true;
    
    // 1. mint and trnafer to the token distribution contract
    erc20.mint(address(tokenDistribution), tokens);

    // 3. transfer the ownership of erc20 to the owner of this contract
    erc20.addMinter(owner());

    // 4. transfer the token distribution back to the owner
    tokenDistribution.transferOwnership(owner());

    // close the escrow conracts
    ethEscrow.terminate();
    stablecoinEscrow.terminate();

    emit Complete();
  }
}
