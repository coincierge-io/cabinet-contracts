const {expect} = require('../../../../../common/test/helpers');
const {deploySpeVerifier} = require('../../utils');
const {deployClaimRegistry} = require('../../../identity/utils');

contract('SPE Verifier: ctor', accounts => {
  let speVerifier;
  let claimRegistry;
  const mainController = accounts[1];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);

    speVerifier = await deploySpeVerifier(accounts, {claimRegistry});
  });

  it('should return store the correct ClaimRegistry', async () => {
    const storedClaimRegistry = await speVerifier.claimRegistry();
    expect(storedClaimRegistry).to.equal(claimRegistry.address);
  });
});
