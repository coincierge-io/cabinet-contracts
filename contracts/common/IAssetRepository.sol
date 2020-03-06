pragma solidity ^0.5.7;


interface IAssetRepository {
  function registerAsset(string calldata symbol, address asset) external returns(address);
}