pragma solidity ^0.5.7;

library ContractFactory {
  event ContractDeployed(address contractAddress);

  /**
    * @dev Deploy contract with CREATE2
    * @param salt The salt used to the contract address computation
    * @param code The bytecode of of the contract to be deployed
    */
  function deploy(bytes32 salt, bytes memory code) internal returns (address) {
    address addr = _deploy(salt, code);
    return addr;
  }

  /**
   * @dev Function to compute the address of a contract created with CREATE2.
   * @param salt The salt used to the contract address computation
   * @param code The bytecode of the contract to be deployed
   * @return the computed address of the smart contract.
   */
  function computeAddress(
    bytes32 salt, 
    bytes memory code
  ) internal view returns (address) {
    return computeAddress(salt, code, address(this));
  }

  /**
   * @dev Function to compute the address of a contract created with CREATE2
   * with the deployer address.
   * @param salt The salt used to the contract address computation
   * @param code The bytecode of the contract to be deployed
   * @param deployer the address of the contract that will deploy the contract
   * @return the computed address of the smart contract.
   */
  function computeAddress(
    bytes32 salt, 
    bytes memory code, 
    address deployer
  ) 
    internal 
    pure 
    returns (address) 
  {
    bytes32 codeHash = keccak256(code);
    bytes32 _data = keccak256(
      abi.encodePacked(bytes1(0xff), deployer, salt, codeHash)
    );
    
    return address(bytes20(_data << 96));
  }

  /**
   * @dev Internal function to deploy contract with CREATE2
   * @param salt The salt used to the contract address computation
   * @param code The bytecode of the contract to be deployed
   */
  function _deploy(bytes32 salt, bytes memory code) 
    private 
    returns(address) 
  {
    address deployedAddress;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      deployedAddress := create2(0, add(code, 0x20), mload(code), salt)
      if iszero(extcodesize(deployedAddress)) {
        revert(0, 0)
      }
    }
    
    emit ContractDeployed(deployedAddress);

    return deployedAddress;
  }
}
