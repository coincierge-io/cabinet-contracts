pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";


contract SignatureVerifier is SignerRole {
  using ECDSA for bytes32;

  function verifySignature(
    bytes memory sig,
    bytes16 nonce,
    string memory message
  ) public view returns(bool)
  {
    bytes32 typeHash = keccak256(
      abi.encodePacked("string Message", "bytes16 nonce")
    );
    bytes32 valueHash = keccak256(
      abi.encodePacked(message, nonce)
    );
    bytes32 hashedMessage = keccak256(abi.encodePacked(typeHash, valueHash));

    address recoveredSigner = hashedMessage.recover(sig);

    return isSigner(recoveredSigner);
  }
} 
