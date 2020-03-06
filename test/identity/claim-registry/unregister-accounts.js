const {expect} = require('../../helpers');
const {shouldFailWithMessage, toHex, padRight} = require('../../helpers/utils');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: unregisterAccounts', accounts => {
  let accountId;
  let claimRegistry;

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
  });

  it('should unregister a single account', async () => {
    await claimRegistry.unregisterAccounts([investor], {from: mainController});
    const aId = await claimRegistry.getAccountId(investor);

    expect(aId).to.equal(padRight(toHex(0), 64));
  });

  it('should unregister multiple accounts', async () => {
    await claimRegistry.unregisterAccounts([investor, investorAdditionalAccount], {from: mainController});
    const aId = await claimRegistry.getAccountId(investor);
    const aId2 = await claimRegistry.getAccountId(investorAdditionalAccount);

    expect(aId).to.equal(padRight(toHex(0), 64));
    expect(aId2).to.equal(padRight(toHex(0), 64));
  });

  it('should unregister an account but leave intact any additional account associated with the same accountId', async () => {
    await claimRegistry.unregisterAccounts([investor], {from: mainController});
    const aId = await claimRegistry.getAccountId(investorAdditionalAccount);

    expect(aId).to.equal(accountId);
  });

  it('should emit AccountUnregistered', async () => {
    const {receipt: {logs}} = await await claimRegistry.unregisterAccounts([investor], {from: mainController});
    const {args} = findEvent(logs, 'AccountUnregistered');

    expect(args.accountId).to.equal(accountId);
    expect(args.account).to.equal(investor);
  });

  it('should be called only by the controller', async () => {
    await shouldFailWithMessage(
      claimRegistry.unregisterAccounts(
        [investor],
        {from: nonController}
      ),
      'Only controller role'
    );
  });
});
