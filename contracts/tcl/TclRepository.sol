pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./ITclRepository.sol";
import "./ControllerRole.sol";
import "../common/ContractFactory.sol";
import "../token/ERC1400/ICNG20.sol";

contract TclRepository is ITclRepository, ControllerRole {
  using Address for address;

  // rule code (a standardized code we can come up with so we can easily recognize the rules)
  mapping (address => mapping (uint256 => ITransferCheckpoint)) private _transferCheckpoints;

  // events
  event CheckpointAdded(address token, uint256 checkpointCode, address transferCheckpoint);
  event CheckpointRemoved(address token, uint256 checkpointCode);

  /**
   * @dev Constructor
   * @param controller The account that will be main controller
   */
  constructor (address controller) 
    ControllerRole(controller, "TRANSFER_CHECKPOINT_REPOSITORY") 
    public {}

  function addCheckpoint(
    ICNG20 token,
    uint256 checkpointCode,
    ITransferCheckpoint transferCheckpoint
  ) 
    public 
    onlyController
  {
    require(address(transferCheckpoint).isContract(), "Transfer Checkpoint must be a conrtact address");

    _transferCheckpoints[address(token)][checkpointCode] = transferCheckpoint;
    emit CheckpointAdded(address(token), checkpointCode, address(transferCheckpoint));
  }

  function addCheckpoints(
    ICNG20 token,
    uint256[] memory checkpointCodes, 
    ITransferCheckpoint[] memory transferCheckpoints
  ) 
    public 
    onlyController
  {
    require(
      checkpointCodes.length == transferCheckpoints.length, 
      "Array length mismatch"
    );

    for (uint256 i = 0; i < checkpointCodes.length; i++) {
      addCheckpoint(token, checkpointCodes[i], transferCheckpoints[i]);
    }
  }

  function removeCheckpoint(ICNG20 token, uint256 checkpointCode)
    public 
    onlyController
  {
    _transferCheckpoints[address(token)][checkpointCode] = ITransferCheckpoint(address(0));
    emit CheckpointRemoved(address(token), checkpointCode);
  }

  function removeCheckpoints(ICNG20 token, uint256[] memory checkpointCodes) 
    public 
    onlyController
  {
    for (uint256 i = 0; i < checkpointCodes.length; i++) {
      removeCheckpoint(token, checkpointCodes[i]);
    }
  }

  function getCheckpoint(ICNG20 token, uint256 checkpointCode) 
    public
    view
    returns(ITransferCheckpoint) 
  {
    return _transferCheckpoints[address(token)][checkpointCode];
  }

  function deployCheckpoint(
    ICNG20 token, 
    uint256 checkpointCode, 
    bytes memory code,
    bytes32 salt
  ) 
    public
    onlyController
    returns(ITransferCheckpoint) 
  {
    ITransferCheckpoint checkpoint = ITransferCheckpoint(ContractFactory.deploy(salt, code));
    addCheckpoint(token, checkpointCode, checkpoint);
  }
}
