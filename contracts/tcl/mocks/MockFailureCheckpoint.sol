pragma solidity ^0.5.7;

import "../ITransferCheckpoint.sol";
import "../../token/ERC1400/ICNG20.sol";

contract MockFailureCheckpoint is ITransferCheckpoint {
  function canTransfer(
    address /*from*/, 
    address /*to*/, 
    uint256 /*amount*/, 
    bytes memory /*data*/,
    ICNG20 /*token*/
  ) public view returns (bool, byte, bytes32) 
  {
    return (false, 0x50, "Cannot transfer");
  }
}
