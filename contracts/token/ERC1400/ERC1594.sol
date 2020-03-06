pragma solidity  ^0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./IERC1594.sol";
import "./CNG20.sol";
import "../../tcl/TclController.sol";
import "../../common/Bytes32Utils.sol";

/**
 * @title Implementation of ERC1594
 */
contract ERC1594 is IERC1594, CNG20 {
  using Address for address;

  TclController private tclController;
  bool private _isIssuable = true;
  bool private _isControllable = false;

  // events
  event IssuanceFinished();
    
  constructor(TclController _tclController) public {
    require(
      address(_tclController).isContract(),
      "TclController should be a contract address"
    );

    tclController = _tclController;
  }

  modifier whenIssuable() {
    require(_isIssuable, "Issuance period has ended");
    _;
  }

  modifier onlyController() {
    require(tclController.isController(msg.sender), "Only controller role");
    _;
  }

  // ERC1594 implementation

  /**
    * @dev End token issuance period permanently.
    */
  function finishIssuance()
    public
    whenIssuable
  {
    _isIssuable = false;
    emit IssuanceFinished();
  }

  function issue(
    address account,
    uint256 value,
    bytes memory data
  )
    public
    whenIssuable
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransferFrom(address(0), account, value, data);
    require(isSuccess, Bytes32Utils.bytes32ToString(reason));

    _mint(account, value);
    tclController.postTransfer(address(0), account, value, data, this);

    emit Issued(msg.sender, account, value, data);
  }

  function isIssuable() 
    public
    view
    returns(bool) 
  {
    return _isIssuable;
  }

  function transferWithData(
    address to,
    uint256 value,
    bytes memory data
  ) 
    public
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransfer(to, value, data);
    
    require(isSuccess, Bytes32Utils.bytes32ToString(reason));
    require(super.transfer(to, value), "Transfer failed");

    tclController.postTransfer(msg.sender, to, value, data, this);
  }

  function transferFromWithData(
    address from,
    address to,
    uint256 value,
    bytes memory data
  ) 
    public 
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransferFrom(from, to, value, data);

    require(isSuccess, Bytes32Utils.bytes32ToString(reason));
    require(super.transferFrom(from, to, value), "TransferFrom failed");

    tclController.postTransfer(from, to, value, data, this);
  }

  function canTransfer(
    address to,
    uint256 value,
    bytes memory data
  )
    public
    view
    returns (bool, byte, bytes32)
  {
    if(msg.sender != address(0) && balanceOf(msg.sender) < value) {
      return (false, 0x50, "INSUFFICIENT_BALANCE");
    }
    
    return tclController.canTransfer(msg.sender, to, value, data, this);
  }

  function canTransferFrom(
    address from,
    address to,
    uint256 value,
    bytes memory data
  )
    public
    view
    returns (bool, byte, bytes32)
  {
    if(from != address(0) && balanceOf(from) < value) {
      return (false, 0x50, "INSUFFICIENT_BALANCE");
    }
    
    return tclController.canTransfer(from, to, value, data, this);
  }

  function redeem(
    uint256 value, 
    bytes memory data
  ) 
    public 
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransfer(address(0), value, "");

    require(isSuccess, Bytes32Utils.bytes32ToString(reason));
    _burn(msg.sender, value);
    tclController.postTransfer(msg.sender, address(0), value, data, this);

    emit Redeemed(msg.sender, msg.sender, value, data);
  }

  function redeemFrom(
    address account,
    uint256 value,
    bytes memory data
  ) 
    public
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransferFrom(account, address(0), value, "");

    _burnFrom(account, value);
    tclController.postTransfer(account, address(0), value, data, this);

    emit Redeemed(msg.sender, account, value, data);
  }


  // Protect ERC20 by ovveriding the core functions
  function transfer(address to, uint256 value)
    public
    returns (bool)
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransfer(to, value, "");

    require(isSuccess, Bytes32Utils.bytes32ToString(reason));
    bool result = super.transfer(to, value);
    tclController.postTransfer(msg.sender, to, value, "", this);

    return result;
  }

  function transferFrom(
    address from,
    address to,
    uint256 value
  )
    public
    returns (bool)
  {
    (
      bool isSuccess,
      byte ESC,
      bytes32 reason
    ) = canTransferFrom(from, to, value, "");

    require(isSuccess, Bytes32Utils.bytes32ToString(reason));
    bool result = super.transferFrom(from, to, value);
    tclController.postTransfer(from, to, value, "", this);

    return result;
  }
}
