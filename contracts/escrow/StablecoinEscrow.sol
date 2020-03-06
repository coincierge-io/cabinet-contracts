pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import "./BasicEscrow.sol";
import "../common/WhitelistOracle.sol";
import "../token/TokenRepository.sol";

contract StablecoinEscrow is BasicEscrow {
  TokenRepository public tokenRepository;
  mapping (string => bool) private _tokenMap;
  string[] public tokenList;

  constructor(
    uint256 openingTime, 
    uint256 closingTime, 
    address payable wallet,
    WhitelistOracle whitelistOracle,
    TokenRepository _tokenRepository
  ) public BasicEscrow(
      openingTime, 
      closingTime, 
      wallet, 
      whitelistOracle
    ) 
  {
    tokenRepository = _tokenRepository;
  }

  /**
   * @dev returns the token address of the given currency
   * @param currency The token currency i.e. DAI 
   */
  function getTokenAddress(string memory currency) 
    private 
    view 
    returns (IERC20) 
  {
    IERC20 tokenAddress = tokenRepository.getTokenAddress(currency);
    require(address(tokenAddress) != address(0), "Cannot find the given token");

    return tokenAddress;
  }

  /**
   * @dev Stores the contribution that was previously approved by the beneficiary
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the 
   * sender of the message or any other address that has been whitelisted before.
   * @param value The value of ETH contributed
   * @param currency The contribution currency
   */
  function confirmContribution(
    address beneficiary, 
    uint256 value, 
    string memory currency
  ) 
    public 
    returns (bool)
  {
    IERC20 token = getTokenAddress(currency);
    require(
      token.allowance(beneficiary, address(this)) >= value, 
      "Beneficiary has not approved the given amount"
    );

    // transfer the aproved tokens
    token.transferFrom(beneficiary, address(this), value);

    if(!_tokenMap[currency]) {
      tokenList.push(currency);
      _tokenMap[currency] = true;
    }

    storeContribution(beneficiary, value, currency);
  }

  /**
   * @dev Allows contributors to withdraw their contribution
   * The sender should be an address that has some contribution.
   * @param currency The contribution currency
   */
  function withdraw(string memory currency) onlyWhenWithdrawOpen public  {
    IERC20 token = getTokenAddress(currency);
    address beneficiary = msg.sender;
    uint256 amount = _contributions[beneficiary][currency];

    _contributions[beneficiary][currency] = 0;
    token.transfer(beneficiary, amount);

    emit Withdraw(beneficiary, amount, currency);
  }

  /**
   * @dev Transfer the token balance of the given currency to the wallet address
   * @param currency The contribution currency
   */
  function transferBalance(string memory currency) private {
    // 1. find token address and get balance
    IERC20 token = getTokenAddress(currency);
    uint256 balance = token.balanceOf(address(this));
    
    // 2. transfer the balance
    token.transfer(wallet, balance);
  }

  /**
   * @dev overloaded version that allows to pass the currencies explicitly. 
   * most of the time we will call the other terminate function. This is here, just in case the looping
   * in the other function causes issues
   * @param currency The contribution currency
   */
  function terminate(string memory currency) public {
    super.terminate();
    transferBalance(currency);
  }

  /**
   * @dev terminates the escrow so no more contributions are allowed
   */
  function terminate() onlyOwner public  {
    super.terminate();

    for(uint256 i=0; i < tokenList.length; i++) {
      transferBalance(tokenList[i]);
    }
  }
}
