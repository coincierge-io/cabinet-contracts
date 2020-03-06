pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../common/SignatureVerifier.sol";

/**
 * @title TokenDistribution
 * @notice This is the smart contract that will be used during token distribution process. Some of the contributionns
 * will arrive from other mediums of contribution i.e. the ICO runned (btc, fiat etc). After the end of the ICO this 
 * smart contract will get the ownership of the ERC20 contract and will transfer tokens to a given list of addresses
 */
contract TokenDistribution is Ownable, SignatureVerifier {
  using SafeMath for uint256;
  using Address for address;
  mapping(bytes16 => bool) private _usedNonces;

  IERC20 public token;

  /**
   * @param _token the address of the erc20 contract
   */
  constructor(IERC20 _token) public {
    require(address(_token).isContract(), "Token should be a contract address");
    token = _token;
  }

  /**
   * Distributes the given token balances to the contributors specified below
   * @param contributors an array of all contributors
   * @param balances an array of the balances of each contributor
   * @param sig the signature to be verified
   * @param nonce the nonce used by the signature
   * @param message the message used in the signature
   */
  function distribute(
    address[] memory contributors,
    uint256[] memory balances,
    bytes memory sig,
    bytes16 nonce,
    string memory message
  ) public onlyOwner
  {
    require(!_usedNonces[nonce], "Distribution nonce has been used before");
    _usedNonces[nonce] = true;

    require(
      verifySignature(sig, nonce, message),
      "Signature could not be verified"
    );

    require(contributors.length == balances.length, "Array length mismatch");

    for (uint256 i = 0; i < contributors.length; i++) {
      require(
        token.transfer(contributors[i], balances[i]),
        "Error transfering tokens"
      );
    }
  }

  /**
   * Checks if the provided signature is valid
   * @param sig the signature to be verified
   * @param nonce the nonce used by the signature
   * @param message the message used in the signature
   */
  function checkSignature(
    bytes memory sig,
    bytes16 nonce,
    string memory message
  ) public view returns(bool)
  {
    bool isValidNonce = !_usedNonces[nonce];
    bool signatureCheck = verifySignature(sig, nonce, message);

    return isValidNonce && signatureCheck;
  }
}
