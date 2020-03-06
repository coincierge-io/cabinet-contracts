pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/introspection/ERC165.sol";
import "../ITransferCheckpoint.sol";
import "../IPostTransfer.sol";
import "../ControllerRole.sol";
import "../../token/ERC1400/ICNG20.sol";

contract MockPostTransfer is ITransferCheckpoint, IPostTransfer, ControllerRole, ERC165 {
  uint256 public counter = 0;

  constructor(address account) 
    ControllerRole(account, "MOCK_POST_TRANSFER")
    public 
  {
    _registerInterface(this.postTransfer.selector);
  }

  function canTransfer(
    address /*from*/, 
    address /*to*/, 
    uint256 /*amount*/, 
    bytes memory /*data*/,
    ICNG20 /*token*/
  ) public view returns (bool, byte, bytes32) 
  {
    return (true, 0x51, "");
  }
  
  function postTransfer(
    address /*from*/, 
    address /*to*/, 
    uint256 /*amount*/, 
    bytes memory /*data*/,
    ICNG20 /*token*/
  ) 
    public
    onlyController
  {
    counter = counter + 1;
  }
}
