pragma solidity  ^0.5.7;

/**
 * @title Standard Interface of ERC1594
 */
interface IERC1594 {
  // Events
  event Issued(address indexed operator, address indexed to, uint256 value, bytes data);
  event Redeemed(address indexed operator, address indexed from, uint256 value, bytes data);

  // Transfers
  function transferWithData(address to, uint256 value, bytes calldata data) external;
  function transferFromWithData(address from, address to, uint256 value, bytes calldata data) external;

  // Token Issuance
  function isIssuable() external view returns (bool);
  function issue(address account, uint256 value, bytes calldata data) external;

  // Token Redemption
  function redeem(uint256 value, bytes calldata data) external;
  function redeemFrom(address account, uint256 value, bytes calldata data) external;

  // Transfer Validity
  function canTransfer(address to, uint256 value, bytes calldata data) external view returns (bool, byte, bytes32);
  function canTransferFrom(address from, address to, uint256 value, bytes calldata data) external view returns (bool, byte, bytes32);
}
