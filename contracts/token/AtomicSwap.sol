pragma solidity  ^0.5.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


contract AtomicSwap {
  struct SwapPair {
    ERC20 token1;
    ERC20 token2;
    address token1Sender;
    address token2Sender;
    uint sender1Amount;
    uint sender2Amount;
  }

  function swap(SwapPair[] memory pairs)
    public
  {

    for (uint256 i = 0; i < pairs.length; i++) {
      pairs[i].token1.transferFrom(
        pairs[i].token1Sender,
        pairs[i].token2Sender,
        pairs[i].sender1Amount
      );
      pairs[i].token2.transferFrom(
        pairs[i].token2Sender,
        pairs[i].token1Sender,
        pairs[i].sender2Amount
      );
    }
  }
}
