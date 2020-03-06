pragma solidity ^0.5.7;

contract MockContractCtor {
  uint256 public value;

  constructor(uint256 val) public {
    value = val;
  }
}
