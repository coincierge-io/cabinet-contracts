pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./ITclRepository.sol";
import "./ITransferCheckpoint.sol";
import "../token/ERC1400/ICNG20.sol";

library TclExecution {
  using SafeMath for uint256;
  using Address for address;

  struct State {
    mapping (address => uint256[]) executionPlans;
    ITclRepository tclRepository;
  }

  uint256 constant OR = 1001;
  uint256 constant AND = 1002;
  byte constant TRANSFER_SUCCESS = 0x51;
  byte constant TRANSFER_FAIL = 0x50;
  
  // 10 items in a stack can cover a very complex RPN expressions
  uint256 constant EXECUTION_STACK_SIZE = 10;
  
  struct Result {
    bool isSuccess;
    byte ESC;
    bytes32 reason;
  }

  // The following structs are useful to avoid the deep stack exception due to 
  // hitting the limit of locally declared variable
  struct StackItem {
    uint256 checkpointCode;
    bool isResult;
    Result result;
  }

  struct StackOperationResult {
    uint256 stackPtr;
    StackItem stackItem;
  }

  struct TransferData {
    ICNG20 token;
    address from; 
    address to; 
    uint256 amount; 
    bytes data;
  }

  struct Operand {
    StackItem first;
    StackItem second;
  }

  // events
  event ExecutionPlanUpdated(address token);

  /**
   * @dev init the library state
   * @param tclRepository The checkpoint repository
   */
  function setup(
    State storage self,
    ITclRepository tclRepository
  ) 
    internal
  {
    require(address(tclRepository).isContract(), "Checkpoint repository should be a contract address");
    self.tclRepository = tclRepository;
  }

  /**
   * @dev Update the current execution plan
   * @param token The token address
   * @param executionPlan The initial execution plan
   */
  function updateExecutionPlan(
    State storage self, 
    ICNG20 token, 
    uint256[] memory executionPlan
  )
    internal 
  {
    self.executionPlans[address(token)] = executionPlan;

    emit ExecutionPlanUpdated(address(token));
  }

  /**
   * @dev Returns the result of ITransferExecution or the result of an earlier execution
   */
  function getResult(
    State storage self,
    StackItem memory item,
    TransferData memory transferData
  ) 
    private
    view
    returns(Result memory)
  {
    if(item.isResult) {
      return item.result;
    }
    else {
      ITransferCheckpoint checkpoint = self.tclRepository.getCheckpoint(transferData.token, item.checkpointCode);
      (bool isSuccess, byte ESC, bytes32 reason) = checkpoint.canTransfer(
        transferData.from,
        transferData.to,
        transferData.amount,
        transferData.data,
        transferData.token
      );

      return Result(isSuccess, ESC, reason);
    }
  }

  /**
   * @dev Evaluates an Or exression based on the two given StackItems
   */
  function evalauteOrExpression(
    State storage self,
    Operand memory operand,
    TransferData memory transferData
  ) 
    private
    view
    returns(Result memory) 
  {
    Result memory result1 = getResult(self, operand.first, transferData);

    // apply short-circuiting check
    if(result1.isSuccess) {
      return Result(true, result1.ESC, "");
    }

    Result memory result2 = getResult(self, operand.second, transferData);

    if(result2.isSuccess) {
      return Result(true, result2.ESC, "");
    }
    else {
      return Result(false, result2.ESC, result2.reason);
    }
  }

  /**
   * @dev Evaluates an AND exression based on the two given StackItems
   */
  function evalauteAndExpression(
    State storage self,
    Operand memory operand,
    TransferData memory transferData
  ) 
    private
    view
    returns(Result memory) 
  {
    Result memory result1 = getResult(self, operand.first, transferData);

    // add short-circuiting logic
    if(result1.isSuccess) {
      Result memory result2 = getResult(self, operand.second, transferData);

      if(result2.isSuccess) {
        return Result(true, result2.ESC, "");
      }
      else {
        return Result(false, result2.ESC, result2.reason);
      }
    }
    else {
      return Result(false, result1.ESC, result1.reason);
    }
  }

  /**
   * @dev Pop a stack item 
   */
  function pop(
    State storage self,
    StackItem[] memory stack,
    uint256 stackPtr
  ) 
    private 
    pure
    returns(StackOperationResult memory)
  {
    uint256 ptr = stackPtr.sub(1);
    StackItem memory item = stack[ptr];

    return StackOperationResult(ptr, item);
  }

  /**
   * @dev Pushes the given item to the stack
   */
  function push(
    State storage self,
    StackItem[] memory stack, 
    StackItem memory item,
    uint256 stackPtr
  ) 
    private 
    pure
    returns(StackOperationResult memory)
  {
    stack[stackPtr] = item;
    return StackOperationResult(stackPtr.add(1), item);
  }

  /**
   * @dev Runs the execution plan
   */
  function execute(
    State storage self,
    TransferData memory transferData
  ) 
    internal 
    view
    returns (bool, byte, bytes32)
  {
    StackOperationResult memory operationResult;
    operationResult.stackPtr = 0;

    StackItem[] memory stack = new StackItem[](EXECUTION_STACK_SIZE);
    uint256[] memory executionPlan = self.executionPlans[address(transferData.token)];

    uint256 count = executionPlan.length;
    uint256 token;

    if (count == 0) {
      return (true, TRANSFER_SUCCESS, "");
    }

    for(uint256 i = 0; i < count; i++) {
      token = executionPlan[i];

      if(token == OR) {
        StackOperationResult memory result1 = pop(self, stack, operationResult.stackPtr);
        StackOperationResult memory result2 = pop(self, stack, result1.stackPtr);

        Result memory result = evalauteOrExpression(
          self, 
          Operand(result1.stackItem, result2.stackItem),  
          transferData
        );

        operationResult = push(self, stack, StackItem(0, true, result), result2.stackPtr);
      }
      else if(token == AND) {
        StackOperationResult memory result1 = pop(self, stack, operationResult.stackPtr);
        StackOperationResult memory result2 = pop(self, stack, result1.stackPtr);

        Result memory result = evalauteAndExpression(
          self, 
          Operand(result1.stackItem, result2.stackItem), 
          transferData
        );

        operationResult = push(self, stack, StackItem(0, true, result), result2.stackPtr);
      }
      else {
        operationResult = push(
          self, 
          stack, 
          StackItem(token, false, Result(false, "", "")),
          operationResult.stackPtr
        ); 
      }
    }

    if(operationResult.stackPtr > 1) {
      return (false, TRANSFER_FAIL, "Too many items in the stack");
    }

    operationResult = pop(self, stack, operationResult.stackPtr);

    // Deal with the single stack item that is left
    Result memory result = getResult(
      self, 
      operationResult.stackItem, 
      transferData
    );

    return (result.isSuccess, result.ESC, result.reason);
  }
}
