const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, toHex, padRight} = require('../../../../common/test/helpers/utils');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry, 
  createAccountId
} = require('../utils');

contract('ClaimRegistry: unregisterAccount', accounts => {
  let accountId;
  let accountId2;

  const mainController = accounts[1];
  const nonController = accounts[3];
  const investor = accounts[4];
  const investorAdditionalAccount = accounts[5];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
    accountId = createAccountId('Pavlos', 'Polianidis');

    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId,
      investorAdditionalAccount,
      {from: mainController}
    );
  })

  it('should unregister an existing account', async () => {
    await claimRegistry.unregisterAccount(investor, {from: mainController});
    const aId = await claimRegistry.getAccountId(investor);

    expect(aId).to.equal(padRight(toHex(0), 64));
  })

  it('should unregister an account but leave intact any additional account associated with the same accountId', async () => {
    await claimRegistry.unregisterAccount(investor, {from: mainController});
    const aId = await claimRegistry.getAccountId(investorAdditionalAccount);

    expect(aId).to.equal(accountId);
  })

  it('should emit AccountUnregistered', async () => {
    const {receipt: {logs}} = await await claimRegistry.unregisterAccount(investor, {from: mainController});
    const {args} = findEvent(logs, 'AccountUnregistered');

    expect(args.accountId).to.equal(accountId);
    expect(args.account).to.equal(investor);
  })

  it('should be called only by the controller', async () => {
    await shouldFailWithMessage(
      claimRegistry.unregisterAccount(
        investor,
        {from: nonController}
      ),
      'Only controller role'
    );
  })
})
