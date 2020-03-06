pragma solidity ^0.5.7;

/**
 * @title TimeGuard
 * @dev Auxiliary contract that check the given time restrictions
 */
contract TimeGuard { 
  uint256 public openingTime;
  uint256 public closingTime;

  /**
   * @dev Reverts if not within the allowed time range.
   */
  modifier onlyWhileOpen {
    // solium-disable-next-line security/no-block-members
    require(block.timestamp >= openingTime && block.timestamp <= closingTime, "Time restrictions not met");
    _;
  }

  /**
   * @dev Constructor, takes opening and closing times.
   * @param _openingTime opening time
   * @param _closingTime closing time
   */
  constructor(uint256 _openingTime, uint256 _closingTime) public {
    _setTime(_openingTime, _closingTime);
  }

  /**
   * Update the opening and closing time
   * @param _openingTime opening time
   * @param _closingTime closing time
   */
  function updateTime(uint256 _openingTime, uint256 _closingTime) public {
    _setTime(_openingTime, _closingTime);
  }

  /**
   * Update the closing time
   * @param _closingTime the new closing time
   */
  function extendTime(uint256 _closingTime) public {
    require(_closingTime >= openingTime, "Closing time cannot be after existing opening time");
    closingTime = _closingTime;
  }

  /**
   * @dev assign the opening and closing time to the state variables
   * @param _openingTime opening time
   * @param _closingTime closing time
   */
  function _setTime(uint256 _openingTime, uint256 _closingTime) private {
    // solium-disable-next-line security/no-block-members
    require(_openingTime >= block.timestamp, "Opening time cannot be before the current block time");
    require(_closingTime >= _openingTime, "Closing time cannot be after the opening time");

    openingTime = _openingTime;
    closingTime = _closingTime;
  }

  /**
   * @dev Checks whether the period has already elapsed.
   * @return Whether period has elapsed
   */
  function isClosed() public view returns (bool) {
    // solium-disable-next-line security/no-block-members
    return block.timestamp > closingTime;
  }
}
