const CNG1400 = artifacts.require('CNG1400');
const {deployTokenFactory, deployAssetRepository} = require('../../helpers/deploy');
const {findEvent} = require('../../helpers/events');
const {deployTclControllerWithDefaultCheckpoints} = require('../../tcl/utils');
const {expect} = require('../../../../common/test/helpers');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployClaimRegistry} = require('../../identity/utils');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {getAccessToken} = require('../../../../../js/packages/eth-utils/data/v1/accessControl');
const {getPrivateKeyFromAddress} = require('../../../../common/test/helpers/signatures');
const {getMethodSelectorFromAbi} = require('../../../../../js/packages/eth-utils/contracts/v1/Contract');

contract('TokenFactory: DeployCNG1400', accounts => {
  const SYMBOL = 'ERC';
  const nonce = SYMBOL;

  let tokenFactory;
  let claimRegistry;
  let tclController;
  let accessToken;
  let methodSelector;
  let assetRepositoryInstance;
  const {mainController, issuer, dodgyGuy} = getTclActors(accounts);

  beforeEach(async () => {
    assetRepositoryInstance = await deployAssetRepository();
    ({tclController} = await deployTclControllerWithDefaultCheckpoints(accounts));
    tokenFactory = await deployTokenFactory(accounts, assetRepositoryInstance);
    claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
    methodSelector = getMethodSelectorFromAbi(tokenFactory.abi, 'deployCNG1400');

    ({accessToken} = getAccessToken({
      privKey: getPrivateKeyFromAddress(mainController),
      bearer: issuer,
      method: methodSelector,
      nonce,
      restrictedContractAddress: tokenFactory.address
    }));
  });

  it('should deploy an CNG1400 token with correct parameters and empty execution plan', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployCNG1400(
        tclController.address,
        claimRegistry.address,
        issuer,
        'testName',
        SYMBOL,
        18,
        accessToken,
        {from: issuer}
      );

    const {args} = findEvent(logs, 'DeployCNG1400');
    const {tokenAddress} = args;
    const CNG1400Contract = await CNG1400.at(tokenAddress);
    const owner = await CNG1400Contract.owner.call();
    const name = await CNG1400Contract.name.call();
    const symbol = await CNG1400Contract.symbol.call();

    expect(owner).to.be.equal(issuer);
    expect(name).to.be.equal('testName');
    expect(symbol).to.be.equal(SYMBOL);
  });

  it('should register the token in the assetRepository', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployCNG1400(
        tclController.address,
        claimRegistry.address,
        issuer,
        'testName',
        SYMBOL,
        18,
        accessToken,
        {from: issuer}
      );
    const {args} = findEvent(logs, 'DeployCNG1400');
    const {tokenAddress} = args;
    const symbolAddress = await assetRepositoryInstance.assets.call(SYMBOL);

    expect(tokenAddress).to.be.equal(symbolAddress);
  });

  it('should revert if access token is not valid', async () => {
    await shouldFailWithMessage(
      tokenFactory
        .deployCNG1400(
          tclController.address,
          claimRegistry.address,
          issuer,
          'testName',
          SYMBOL,
          18,
          accessToken,
          {from: dodgyGuy}
        ),
      'Invalid Access Token'
    );
  });
});
