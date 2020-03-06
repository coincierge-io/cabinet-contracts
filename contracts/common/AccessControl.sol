pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";


/**
 * @title AccessControl
 * @notice This is the smart contract will manage access to other
 * smart contracts by providing a signature created
 * offchain by one of the Signers of this contract.
 */
contract AccessControl is SignerRole {
  using ECDSA for bytes32;

  mapping(string => bool) private _usedNonces;

  function nonceExists(string memory nonce) public view returns(bool) {
    return _usedNonces[nonce];
  }

  /**
   * As Ethereum JSON-RPC prepends a security string before signing arbitrary data.
   * With this function, we derive the Web3 hashed message.
   * More here: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
   * @param nonce the nonce used in the signature
   */
  function getPayload(
    bytes4 method,
    string memory nonce
  )
    public
    view
    returns(bytes32)
  {
    bytes memory encodedMessage = abi.encodePacked(
      address(this),
      method,
      msg.sender,
      nonce
    );

    bytes32 hashedMessage = keccak256(encodedMessage);
    bytes32 ethMessageHash = hashedMessage.toEthSignedMessageHash();

    return ethMessageHash;
  }

  /**
   * Checks if the provided signature will grant access
   * @param nonce the nonce used to build the message
   * @param accessToken the signature to be verified
   */
  modifier whenAuthorised(
    bytes4 method,
    string memory nonce,
    bytes memory accessToken
  )
  {
    require(!nonceExists(nonce), "Nonce already used");

    bytes32 payload = getPayload(method, nonce);
    address signer = payload.recover(accessToken);
    require(isSigner(signer), "Invalid Access Token");

    invalidateNonce(nonce);

    _;
  }

  /**
   * Stores the nonce in the list of used ones.
   * @param nonce the nonce used in the signature
   */
  function invalidateNonce(string memory nonce) private {
    _usedNonces[nonce] = true;
  }
}
