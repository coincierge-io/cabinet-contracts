pragma solidity  ^0.5.7;

import "../common/AccessControl.sol";
import "./CappedMintableTokenFactory.sol";
import "./CNG1400TokenFactory.sol";
import "../tcl/TclController.sol";
import "../identity/IClaimRegistry.sol";
import "../tcl/TclExecution.sol";
import "../tcl/TclRepository.sol";
import "../common/IAssetRepository.sol";


contract TokenFactory is AccessControl {
  CappedMintableTokenFactory erc20Factory;
  CNG1400TokenFactory cng1400Factory;
  IAssetRepository assetRepository;

  event DeployERC20(
    address indexed tokenAddress,
    string tokenName,
    string symbol
  );
  event DeployCNG1400(
    address indexed tokenAddress,
    string tokenName,
    string symbol
  );

  constructor(
    address erc20FactoryAddress,
    address cng1400FactoryAddress,
    address assetRepositoryAddress
  )
    public
  {
    erc20Factory = CappedMintableTokenFactory(erc20FactoryAddress);
    cng1400Factory = CNG1400TokenFactory(cng1400FactoryAddress);
    assetRepository = IAssetRepository(assetRepositoryAddress);
  }

  function deployERC20(
    address tokenOwner,
    string memory name,
    string memory symbol,
    uint256 cap,
    bytes memory cngAccessToken
  )
    public
    whenAuthorised(this.deployERC20.selector, symbol, cngAccessToken)
  {
    address newToken = erc20Factory.deploy(
      tokenOwner,
      name,
      symbol,
      cap
    );
    assetRepository.registerAsset(symbol, newToken);

    emit DeployERC20(newToken, name, symbol);
  }

  function deployCNG1400(
    TclController tclController,
    IClaimRegistry claimRegistry,
    address issuer,
    string memory name,
    string memory symbol,
    uint8 decimals,
    bytes memory cngAccessToken
  )
    public
    whenAuthorised(this.deployCNG1400.selector, symbol, cngAccessToken)
  {
    address newToken = cng1400Factory.deploy(
      tclController,
      claimRegistry,
      issuer,
      name,
      symbol,
      decimals
    );
    assetRepository.registerAsset(symbol, newToken);

    emit DeployCNG1400(newToken, name, symbol);
  }
}
