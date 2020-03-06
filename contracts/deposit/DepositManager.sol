pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../token/TokenRepository.sol";
import "../token/ERC1400/CNG1400.sol";
import "./EthDeposit.sol";
import "./StablecoinDeposit.sol";
import "./IDeposit.sol";
import "../tcl/ControllerRole.sol";

contract DepositManager is Pausable, ControllerRole {
  using SafeMath for uint256;
  using Address for address;

  address payable public wallet;

  IDeposit public ethDeposit;
  IDeposit public stablecoinDeposit;

  constructor(
    address payable _wallet,
    TokenRepository tokenRepository,
    address controller
  )
    ControllerRole(controller, "DEPOSIT_MANAGER")
    public
  {
    require(_wallet != address(0), "Wallet must be a valid address");
    require(address(tokenRepository).isContract(), "Token repository should be a contract address");

    wallet = _wallet;
    ethDeposit = new EthDeposit(wallet);
    stablecoinDeposit = new StablecoinDeposit(wallet, tokenRepository);
  }

  /**
   * @dev allows the owner to enable or disable the withdraw of the deposits
   * @param isWithdrawEnabled Should the withdraw be enabled?
   */
  function changeWithdrawState(bool isWithdrawEnabled) public {
    ethDeposit.changeWithdrawState(isWithdrawEnabled);
    stablecoinDeposit.changeWithdrawState(isWithdrawEnabled);
  }

  /**
   * @dev allows to mint and move deposit with a single atomic function
   * @param beneficiary Address that will be entitled to receive the tokens. It can be either the
   * sender of the message or any other address that has been whitelisted before.
   * @param depositValue The value of eth/stablecoin deposited
   * @param tokenValue The amount of tokens to mint
   * @param currency The deposit currency
   * @param cng1400 The address of the token to mint
   */
  function issue(
    address beneficiary,
    uint256 depositValue,
    uint256 tokenValue,
    string memory currency,
    CNG1400 cng1400
  )
    public
    onlyController
  {
    cng1400.issue(beneficiary, tokenValue, "Initial Offering");

    if (keccak256(abi.encodePacked(currency)) == keccak256(abi.encodePacked("ETH"))) {
      ethDeposit.release(beneficiary, depositValue, currency);
    }
    else {
      stablecoinDeposit.release(beneficiary, depositValue, currency);
    }
  }
}
