const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry, 
  createAccountId
} = require('../utils');

contract('ClaimRegistry: registerAccount', accounts => {
  let accountId;
  let accountId2;

  const mainController = accounts[1];
  const nonController = accounts[3];
  const investor = accounts[4];
  const investorAdditionalAccount = accounts[5];
  const investor2 = accounts[6];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
    accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
    accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');
  })

  it('should register an account with the given accountId', async () => {
    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    const aId = await claimRegistry.getAccountId(investor);

    expect(aId).to.equal(accountId);
  })

  it('should register multiple accounts with the given accountId', async () => {
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

    const aId = await claimRegistry.getAccountId(investor);
    const aId2 = await claimRegistry.getAccountId(investorAdditionalAccount);

    expect(aId).to.equal(accountId);
    expect(aId2).to.equal(accountId);
  })

  it('should handle multiple account ids', async () => {
    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    const aId = await claimRegistry.getAccountId(investor);
    expect(aId).to.equal(accountId);

    await claimRegistry.registerAccount(
      accountId2,
      investor2,
      {from: mainController}
    );

    const aId2 = await claimRegistry.getAccountId(investor2);

    expect(aId2).to.equal(accountId2);
  })

  it('should emit AccountRegistered', async () => {
    const {receipt: {logs}} = await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    const {args} = findEvent(logs, 'AccountRegistered');

    expect(args.accountId).to.equal(accountId);
    expect(args.account).to.equal(investor);
  })

  it('should be called only by the controller', async () => {
    await shouldFailWithMessage(
      claimRegistry.registerAccount(
        accountId,
        investor,
        {from: nonController}
      ),
      'Only controller role'
    );
  })

  it('should disallow account overrides', async () => {
    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    await shouldFailWithMessage(
      claimRegistry.registerAccount(
        accountId,
        investor,
        {from: mainController}
      ),
      'Cannot override account'
    );  
  })
});
