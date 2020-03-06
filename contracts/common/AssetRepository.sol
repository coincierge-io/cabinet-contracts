pragma solidity ^0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../tcl/ControllerRole.sol";
import "./IAssetRepository.sol";


contract AssetRepository is IAssetRepository, ControllerRole {
  using Address for address;

  mapping (string => address) public assets;

  constructor () public ControllerRole(msg.sender, "ASSET_REPOSITORY") {}

  function registerAsset(string memory symbol, address asset)
    public
    onlyController
    returns(address)
  {
    require(assets[symbol] == address(0), "Symbol already exists");
    require(address(asset).isContract(), "asset should be a contract address");

    assets[symbol] = asset;
  }
}