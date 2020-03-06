pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165Checker.sol";
import "./ITclRepository.sol";
import "./ControllerRole.sol";
import "./TclExecution.sol";
import "./IPostTransfer.sol";
import "../token/ERC1400/ICNG20.sol";


contract TclController is ControllerRole {
  using Address for ERC165Checker;
  using TclExecution for TclExecution.State;

  uint256 constant OR = 1001;
  uint256 constant AND = 1002;

  TclExecution.State private _state;
  mapping(address => IPostTransfer[]) public _postTransfers;

  /**
   * @dev Constructor
   * @param tclRepository The checkpoint repository
   * @param controller The account that will be main controller
   */
  constructor (
    ITclRepository tclRepository,
    address controller
  ) 
    ControllerRole(controller, "TCL_CONTROLLER") 
    public 
  {
    _state.setup(tclRepository);
  }

  /**
   * @dev Will find out which of the checkpoint in the given execution plan are IPostTransfer
   *      and will update the _postTransfers accodrdingly
   * @param executionPlan The execution plan
   * @param token The token address
   */
  function setupPostTransfer(ICNG20 token, uint256[] memory executionPlan) private {
    // reset
    IPostTransfer[] storage postTransfers = _postTransfers[address(token)];
    postTransfers.length = 0;

    for(uint256 i = 0; i < executionPlan.length; i++) {
      uint256 checkpointCode = executionPlan[i];

      if(checkpointCode != OR && checkpointCode != AND) {
        address checkpoint = address(_state.tclRepository.getCheckpoint(token, checkpointCode));
        bool isIPostTransfer = ERC165Checker._supportsInterface(checkpoint, IPostTransfer(0).postTransfer.selector);

        if(isIPostTransfer) {
          postTransfers.push(IPostTransfer(checkpoint));
        }
      }
    }
  }

  /**
   * @dev Update the current execution plan
   * @param executionPlan The initial execution plan
   * @param token The token address
   */
  function updateExecutionPlan(ICNG20 token, uint256[] memory executionPlan)
    onlyController
    public 
  {
    _state.updateExecutionPlan(token, executionPlan);
    setupPostTransfer(token, executionPlan);
  }

  /**
   * @dev returns the current execution plan
   * @param token The token address
   */
  function getExecutionPlan(ICNG20 token) 
    public
    view 
    returns(uint256[] memory)
  {
    return _state.executionPlans[address(token)];
  }

  /**
   * @dev returns the checkpoint repository
   */
  function getTclRepository() 
    public 
    view 
    returns(ITclRepository) 
  {
    return _state.tclRepository;
  }

  /**
   * @dev Executes a function on the given checkpoint based on the provided data
   * @param checkpoint The checkpoint address
   * @param data The encoded data that will call the function on the checkpoint
   */
  function manageCheckpoint(
    address checkpoint,
    bytes memory data
  ) 
    public 
    onlyController
  {
    (bool success,) = checkpoint.call(data);
    require(success, "Manage checkpoint action failed");
  }

  /**
   * @dev Checks if transfer can happen
   */
  function canTransfer(
    address from, 
    address to, 
    uint256 amount, 
    bytes memory data,
    ICNG20 token
  ) 
    public 
    view
    returns (bool, byte, bytes32)
  {
    TclExecution.TransferData memory transferData = TclExecution.TransferData(
      token,
      from,
      to,
      amount,
      data
    );

    return _state.execute(transferData);
  }

  /**
   * @dev Call all IPostTransfer
   */
  function postTransfer(
    address from, 
    address to, 
    uint256 amount, 
    bytes memory data,
    ICNG20 token
  ) 
    public 
  {
    require(msg.sender == address(token) || isController(msg.sender), "Only token or controller address");
    IPostTransfer[] memory postTransfers =  _postTransfers[address(token)];

    for(uint256 i = 0; i < postTransfers.length; i++) {
      postTransfers[i].postTransfer(from, to, amount, data, token);
    }
  }
}
