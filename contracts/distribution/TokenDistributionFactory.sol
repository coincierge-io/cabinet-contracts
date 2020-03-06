pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./TokenDistribution.sol";


/**
 * @title TokenVestingFactory
 * @notice This is the smart contract that will be used to deploy and store token distribution smart contracts
 */
contract TokenDistributionFactory is Ownable {
  using Address for address;

  struct TokenDistributionData {
    TokenDistribution tokenDistribution;
    bool exists;
  }

  // erc20 -> TokenDistributionData
  mapping (address => TokenDistributionData) _tokenDistributionData;

  modifier canDeploy(address token) {
    require(!_tokenDistributionData[token].exists, "Token distribution contract already exist");
    require(address(token).isContract(), "Token should be a contract address");
    _;
  }

  // Events
  event LogTokenDistributionDeployed(address indexed token, address indexed tokenDistribution);

  /**
   * @notice Returns the token distribution data for the given token smart contract
   * @param erc20 The address of the erc to token
   */
  function getTokenDistributionData(address erc20) 
    public 
    view 
    returns (TokenDistribution) 
  {
    TokenDistributionData memory data = _tokenDistributionData[erc20];

    return (data.tokenDistribution);
  }

  /**
   * @notice Deploys a new token distribution contract for the given erc20 contract
   * @param erc20 The address of the erc to token
   */
  function deploy(ERC20 erc20)
    canDeploy(address(erc20))
    public 
    returns (TokenDistribution)  
  {
    TokenDistribution tokenDistribution = new TokenDistribution(erc20);

    TokenDistributionData memory data = TokenDistributionData({
      tokenDistribution: tokenDistribution,
      exists: true
    });

    _tokenDistributionData[address(erc20)] = data;

    // transfer the ownership to the owner of this factory contract
    tokenDistribution.transferOwnership(owner());
    tokenDistribution.addSigner(msg.sender);
    tokenDistribution.renounceSigner();

    emit LogTokenDistributionDeployed(address(erc20), address(tokenDistribution));

    return tokenDistribution;
  }
}
