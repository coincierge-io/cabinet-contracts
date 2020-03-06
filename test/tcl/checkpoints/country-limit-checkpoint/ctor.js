const {expect} = require('../../helpers');
const {deployCountryLimitCheckpoint} = require('../../utils');
const {deployClaimRegistry} = require('../../../identity/utils');
const {expectVMException, encodeFunctionSignature} = require('../../../helpers/utils');
const {checkpointControler} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');

contract('CountryLimitCheckpoint: ctor', accounts => {
  let countryLimitCheckpoint;
  let claimRegistry;

  const mainController = accounts[1];

  beforeEach(async () => {
    claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
    countryLimitCheckpoint = await deployCountryLimitCheckpoint(
      accounts,
      {account: mainController, claimRegistry: claimRegistry.address},
      {from: mainController}
    );
  });

  it('should store the address of the ClaimRegistry checkpoint', async () => {
    const storedClaimRegistry = await countryLimitCheckpoint.claimRegistry();
    expect(storedClaimRegistry).to.equal(claimRegistry.address);
  });

  it('should set the correct account as the main controller', async () => {
    const isController = await countryLimitCheckpoint.isController(mainController);
    expect(isController).to.equal(true);
  });

  it('should set the correct controller of value', async () => {
    const controllerOf = await countryLimitCheckpoint.controllerOf();
    expect(controllerOf).to.equal(checkpointControler.countryLimitCheckpoint);
  });

  it('should register the IPostTransfer interface via ERC165', async () => {
    const isIPostTransfer = await countryLimitCheckpoint.supportsInterface(
      encodeFunctionSignature('postTransfer(address,address,uint256,bytes,address)')
    );

    expect(isIPostTransfer).to.equal(true);
  });

  it('should revert if ClaimRegistry checkpoint repository is not a contract address', async () => {
    await expectVMException(
      deployCountryLimitCheckpoint(
        accounts,
        {account: mainController, claimRegistry: accounts[2]},
        {from: mainController}
      )
    );
  });
});
