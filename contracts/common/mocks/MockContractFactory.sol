pragma solidity ^0.5.7;

import "../ContractFactory.sol";

contract MockContractFactory {
  function deploy(bytes32 salt, bytes memory code) public {
    ContractFactory.deploy(salt, code);
  }

  function computeAddress(bytes32 salt, bytes memory code) public view returns (address) {
    return ContractFactory.computeAddress(salt, code);
  }

  function computeAddress(
    bytes32 salt, 
    bytes memory code, 
    address deployer
  ) 
    public 
    pure 
    returns (address) 
  {
    return ContractFactory.computeAddress(salt, code, deployer);
  }
}
