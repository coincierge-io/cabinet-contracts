pragma solidity ^0.5.7;

import "../ITransferCheckpoint.sol";
import "../../token/ERC1400/ICNG20.sol";

contract MockSuccessCheckpoint is ITransferCheckpoint {
  function canTransfer(
    address /*from*/, 
    address /*to*/, 
    uint256 /*amount*/, 
    bytes memory, /*data*/
    ICNG20 /*token*/
  ) public view returns (bool, byte, bytes32) 
  {
    return (true, 0x51, "");
  }
}
