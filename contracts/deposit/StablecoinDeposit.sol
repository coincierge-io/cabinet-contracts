pragma solidity ^0.5.0;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';
import "./BasicDeposit.sol";
import "../token/TokenRepository.sol";


contract StablecoinDeposit is BasicDeposit {
  TokenRepository public tokenRepository;

  constructor(
    address payable wallet,
    TokenRepository _tokenRepository
  )
  public
  BasicDeposit(wallet)
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
   * @dev Stores the deposit that was previously approved by the beneficiary
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the
   * sender of the message or any other address that has been whitelisted before.
   * @param value The value of stablecoin deposited
   * @param currency The deposit currency
   */
  function confirmDeposit(
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

    // transfer the approved tokens
    token.transferFrom(beneficiary, address(this), value);
    storeDeposit(beneficiary, value, currency);
  }

  /**
   * @dev Allows investors to withdraw their deposit
   * The sender should be an address that has some deposit.
   * @param currency The deposit currency
   */
  function withdraw(string memory currency) onlyWhenWithdrawOpen public {
    IERC20 token = getTokenAddress(currency);
    address beneficiary = msg.sender;
    uint256 amount = _deposits[beneficiary][currency];

    _deposits[beneficiary][currency] = 0;
    token.transfer(beneficiary, amount);

    emit Withdraw(beneficiary, amount, currency);
  }

  /**
   * @dev Allows the owner to release part or all of the investor's deposits
   * The sender should be the ownewr of the contract.
   * @param beneficiary The investor whos deposit will be released
   * @param value The amount that will be released
   * @param currency The deposit's currency
   */
  function release(
    address beneficiary,
    uint256 value,
    string memory currency
  )
  public
  onlyOwner
  {
    IERC20 token = getTokenAddress(currency);
    uint256 accountBalance = _deposits[beneficiary][currency];
    require(accountBalance >= value, "Cannot release more than the account's balance");

    token.transfer(wallet, value);
    _deposits[beneficiary][currency] = _deposits[beneficiary][currency].sub(value);
    
    emit Release(beneficiary, value, currency);
  }
}
