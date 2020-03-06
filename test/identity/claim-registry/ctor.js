const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {deployClaimRegistry} = require('../utils');

contract('ClaimRegistry: ctor', accounts => {
  let claimRegistry;

  const mainController = accounts[1];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
  })

  it('should set the correct account as the main controller', async () => {
    const isController = await claimRegistry.isController(mainController);
    expect(isController).to.equal(true);
  })
});
