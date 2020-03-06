const {expect} = require('../../helpers');

const {
  deployKycAmlCheckpoint
} = require('../../utils');

const {
  deployClaimRegistry,
  createAccountId,
  createClaim,
  claimKeys
} = require('../../../identity/utils');
const {add} = require('../../../helpers/date');
const {increaseTimeTo} = require('../../../helpers/timeUtils');

contract('KycAmlCheckpoint: isRegistered', accounts => {
  let kycAmlCheckpoint;

  let claimRegistry;

  const mainController = accounts[1];
  const investor = accounts[2];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);

    kycAmlCheckpoint = await deployKycAmlCheckpoint(
      accounts,
      claimRegistry.address,
      params
    );
  });

  it('should return true if investor has a valid claim in ClaimRegistry', async () => {
    const claim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER);
    const AccountId = createAccountId(investor);

    await claimRegistry.registerAccount(
      AccountId,
      investor,
      {from: mainController}
    );

    await claimRegistry.setClaim(
      AccountId,
      claimKeys.kycAml,
      claim,
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.isRegistered(investor);
    expect(result).to.equal(true);
  });

  it('should return false if investor does not have claim in ClaimRegistry', async () => {
    const result = await kycAmlCheckpoint.isRegistered(investor);
    expect(result).to.equal(false);
  });

  it('should return false if investor has a expired claim in ClaimRegistry', async () => {
    const claim = createClaim('1', mainController, add(1));
    const AccountId = createAccountId(investor);

    await claimRegistry.registerAccount(
      AccountId,
      investor,
      {from: mainController}
    );

    await claimRegistry.setClaim(
      AccountId,
      claimKeys.kycAml,
      claim,
      {from: mainController}
    );
    await increaseTimeTo(add(2));

    const result = await kycAmlCheckpoint.isRegistered(investor);
    expect(result).to.equal(false);
  });
});
