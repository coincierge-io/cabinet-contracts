pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/drafts/TokenVesting.sol";



contract TokenVestingFactory is Ownable {
  struct VestingData {
    uint256 start;
    uint256 cliff;
    uint256 duration;
    bool revocable;
    bool exists;
  }

  // The vesting contract for each beneficiary
  mapping (address => TokenVesting) private _vestingContracts;

  // The vesting token contract parameters for each beneficiary
  mapping (address => VestingData) _vestingData;

  modifier canDeploy(address beneficiary) {
    require(beneficiary != address(0));
    _;
  }

  // Events 
  event LogTokenVestingDeployed(address indexed beneficiary, address indexed tokenVesting);

  /**
   * @dev contructor
   */
  constructor() public {
    init();
  }

  /**
   * @notice Returns the vesting data for the given account
   *
   * @param beneficiary The address of the beneficiary
   */
  function getVestingData(address beneficiary) 
    public 
    view 
    returns (uint256, uint256, uint256, bool) 
  {
    VestingData memory data = _vestingData[beneficiary];

    return (data.start, data.cliff, data.duration, data.revocable);
  }

  /**
   * @param beneficiary address of the beneficiary to whom vested tokens are transferred
   * @param cliff duration in seconds of the cliff in which tokens will begin to vest
   * @param start the time (as Unix time) at which point vesting starts 
   * @param duration duration in seconds of the period in which the tokens will vest
   * @param revocable whether the vesting is revocable or not
   */
  function deploy(
    address beneficiary,
    uint256 start,
    uint256 cliff,
    uint256 duration,
    bool revocable
  ) 
    canDeploy(beneficiary)
    onlyOwner 
    public 
    returns (TokenVesting) 
  {
    VestingData memory params = VestingData({
      start: start,
      cliff: cliff,
      duration: duration,
      revocable: revocable,
      exists: true
    });

    _vestingData[beneficiary] = params;
    TokenVesting vestingContract = new TokenVesting(
      beneficiary,
      start,
      cliff,
      duration,
      revocable
    );

    _vestingContracts[beneficiary] = vestingContract;

    // transfer the ownership to the owner of this factory contract
    vestingContract.transferOwnership(owner());

    emit LogTokenVestingDeployed(beneficiary, address(vestingContract));

    return vestingContract;
  }

  /**
   * @param beneficiary address of the beneficiary to whom vested tokens are transferred
   */
  function getVestingAddress(address beneficiary) public view returns (TokenVesting) {
    return _vestingContracts[beneficiary];
  }

  /**
   * @dev hardcode all the beneficiaries for who we will deploy TokenVesting contracts
   */
  function init() private {
    // This is just an example. Use real addresses and data
  }
}
