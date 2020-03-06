pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/access/Roles.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract ControllerRole is Ownable {
  using Roles for Roles.Role;

  Roles.Role private _controllers;
  string public controllerOf;

  // Events
  event ControllerAdded(address indexed account, string controllerOf);
  event ControllerRemoved(address indexed account, string controllerOf);

  modifier onlyController() {
    require(isController(msg.sender), "Only controller role");
    _;
  }

  /**
   * @dev Constructor Add the given account both as the owner of the smart contract and a checkpoint controller
   * @param controller The account that will be checked
   * @param _controllerOf Gives more info about the type of controller i.e.TCL_CONTROLLER, or KYC_CONTROLLER
   */
  constructor (address controller, string memory _controllerOf) public {
    require(
      controller != address(0),
      "Main controller should be a valid address"
    );

    controllerOf = _controllerOf;
    _controllers.add(controller);

    emit ControllerAdded(controller, controllerOf);
    transferOwnership(controller);
  }

  /**
   * @dev checks if the given account is a controller
   * @param account The account that will be checked
   */
  function isController(address account) public view returns (bool) {
    return _controllers.has(account);
  }
  
  /**
   * @dev Adds a new account to the controller role
   * @param account The account that will have the controller role
   */
  function addController(address account) public onlyController {
    _controllers.add(account);
    emit ControllerAdded(account, controllerOf);
  } 

  /**
   * @dev Removes the sender from the list the controller role
   */
  function renounceController() public {
    _removeController(msg.sender);
  }

  /**
   * @dev Removes the given account from the controller role, if msg.sender is owner
   * @param controller The account that will have the controller role removed
   */
  function removeController(address controller) public onlyOwner {
    _removeController(controller);
  }

  /**
   * @dev Removes the given account from the controller role
   * @param controller The account that will have the controller role removed
   */
  function _removeController(address controller) private {
    require(owner() != controller, "Owner cannot renounce himself");

    _controllers.remove(controller);
    emit ControllerRemoved(controller, controllerOf);
  }
}
