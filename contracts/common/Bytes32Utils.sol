pragma solidity ^0.5.7;

library Bytes32Utils {
  function bytes32ToBytes(bytes32 value) public pure returns (bytes memory){
    // string memory str = string(bytes32);
    // TypeError: Explicit type conversion not allowed from "bytes32" to "string storage pointer"
    bytes memory bytesArray = new bytes(32);

    for (uint256 i; i < 32; i++) {
      bytesArray[i] = value[i];
    }
    
    return bytesArray;
  }

  function bytes32ToString(bytes32 value) public pure returns (string memory){
    bytes memory bytesArray = bytes32ToBytes(value);
    return string(bytesArray);
  }
}
