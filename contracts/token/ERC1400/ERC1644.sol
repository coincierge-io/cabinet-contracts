pragma solidity  ^0.5.7;

import "./IERC1644.sol";
import "../../tcl/TclController.sol";
import "../../common/Bytes32Utils.sol";
import "./CNG20.sol";


/**
 * @title Implementation of ERC1644
 */
contract ERC1644 is IERC1644, CNG20 {
  TclController private tclController;
  bool private _isControllable = false;

  constructor(TclController _tclController) public {
    tclController = _tclController;
  }

  modifier whenControllable() {
    require(_isControllable, "Token is not controllable.");
    _;
  }


  modifier onlyController() {
    require(tclController.isController(msg.sender), "Only controller role");
    _;
  }

  function isControllable() public view returns (bool) {
    return _isControllable;
  }

  function controllerTransfer(
    address from,
    address to,
    uint256 value,
    bytes memory data,
    bytes memory operatorData
  )
    public
    whenControllable
    onlyController
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = tclController.canTransfer(from, to, value, data, this);
    require(isSuccess, Bytes32Utils.bytes32ToString(reason));

    super._transfer(from, to, value);

    emit ControllerTransfer(
      msg.sender,
      from,
      to,
      value,
      data,
      operatorData
    );
  }

  function controllerRedeem(
    address tokenHolder,
    uint256 value,
    bytes memory data,
    bytes memory operatorData
  )
    public
    whenControllable
    onlyController
  {
    super._burn(tokenHolder, value);

    emit ControllerRedemption(
      msg.sender,
      tokenHolder,
      value,
      data,
      operatorData
    );
  }

  function setIsControllable(bool isControllable) public {
    _isControllable = isControllable;
  }
}
