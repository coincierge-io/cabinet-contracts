pragma solidity ^0.5.7;

import "../AccessControl.sol";


contract MockRestrictedAccess is AccessControl {
  function doSomething(
    string memory nonce,
    bytes memory sig
  )
    public
    whenAuthorised(this.doSomething.selector, nonce, sig)
  {
    this;
  }
}
