const {deployTokenFactory, deployAssetRepository} = require('../../helpers/deploy');
const {findEvent} = require('../../helpers/events');
const {expect} = require('../../../helpers');
const {getTokenOwnerAddress} = require('../../helpers/address');
const {getTclActors} = require('../../helpers/address');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {getAccessToken} = require('../../../../../js/packages/eth-utils/data/v1/accessControl');
const {getPrivateKeyFromAddress} = require('../../helpers/signatures');
const {getMethodSelectorFromAbi} = require('../../../../../js/packages/eth-utils/contracts/v1/Contract');

const CappedMintableToken = artifacts.require('CappedMintableToken');

contract('TokenFactory: DeployErc20', accounts => {
  const SYMBOL = 'ERC';
  const nonce = SYMBOL;

  let tokenFactory;
  let accessToken;
  let methodSelector;
  let assetRepositoryInstance;

  const {mainController, issuer, dodgyGuy} = getTclActors(accounts);

  beforeEach(async () => {
    assetRepositoryInstance = await deployAssetRepository();
    tokenFactory = await deployTokenFactory(accounts, assetRepositoryInstance);
    methodSelector = getMethodSelectorFromAbi(tokenFactory.abi, 'deployERC20');

    ({accessToken} = getAccessToken({
      privKey: getPrivateKeyFromAddress(mainController),
      bearer: issuer,
      method: methodSelector,
      nonce,
      restrictedContractAddress: tokenFactory.address
    }));
  });

  it('should deploy an erc20 token with correct parameters', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployERC20(
        getTokenOwnerAddress(accounts),
        'testName',
        SYMBOL,
        5000000,
        accessToken,
        {from: issuer}
      );

    const {args} = findEvent(logs, 'DeployERC20');
    const {tokenAddress} = args;
    const CappedMintableContract = await CappedMintableToken.at(tokenAddress);
    const name = await CappedMintableContract.name.call();
    const symbol = await CappedMintableContract.symbol.call();
    const cap = await CappedMintableContract.cap.call();

    expect(name).to.be.equal('testName');
    expect(symbol).to.be.equal(SYMBOL);
    expect(cap.toNumber()).to.be.equal(5000000);
  });

  it('should transfer the ownership to the provided address', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployERC20(
        getTokenOwnerAddress(accounts),
        'testName',
        SYMBOL,
        5000000,
        accessToken,
        {from: issuer}
      );

    const {args} = findEvent(logs, 'DeployERC20');
    const {tokenAddress} = args;
    const CappedMintableContract = await CappedMintableToken.at(tokenAddress);
    const owner = await CappedMintableContract.owner.call();

    expect(owner).to.be.equal(getTokenOwnerAddress(accounts));
  });

  it('should should set the user as minter for the new contact', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployERC20(
        getTokenOwnerAddress(accounts),
        'testName',
        SYMBOL,
        5000000,
        accessToken,
        {from: issuer}
      );

    const {args} = findEvent(logs, 'DeployERC20');
    const {tokenAddress} = args;
    const CappedMintableContract = await CappedMintableToken.at(tokenAddress);
    const isMinter = await CappedMintableContract.isMinter.call(getTokenOwnerAddress(accounts));

    expect(isMinter).to.be.equal(true);
  });

  it('should register the token in the assetRepository', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployERC20(
        getTokenOwnerAddress(accounts),
        'testName',
        SYMBOL,
        5000000,
        accessToken,
        {from: issuer}
      );
    const {args} = findEvent(logs, 'DeployERC20');
    const {tokenAddress} = args;
    const symbolAddress = await assetRepositoryInstance.assets.call(SYMBOL);

    expect(tokenAddress).to.be.equal(symbolAddress);
  });

  it('should revert if access token is not valid', async () => {
    await shouldFailWithMessage(
      tokenFactory
        .deployERC20(
          getTokenOwnerAddress(accounts),
          'testName',
          SYMBOL,
          5000000,
          accessToken,
          {from: dodgyGuy}
        ),
      'Invalid Access Token'
    );
  });
});
