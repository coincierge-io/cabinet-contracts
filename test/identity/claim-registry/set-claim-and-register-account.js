const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, bytesToHex, padRight} = require('../../../../common/test/helpers/utils');
const {sub} = require('../../../../common/test/helpers/date');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry,
  createClaim,
  claimKeys,
  decodeClaimValue,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: setClaimAndRegisterAccount', accounts => {
  let claimRegistry;

  const mainController = accounts[1];
  const exchange = accounts[2];
  const nonController = accounts[3];
  const investor = accounts[4];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
  });

  it('should set the given claim for the provided user', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      investor,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);

    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('Country Provider');
    expect(decodeClaimValue(providerProof)).to.equal('country-provider-proof');
  });

  it('should emit ClaimSet and AccountRegistered', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    const {receipt: {logs}} = await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      investor,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const {args: argsClaim} = findEvent(logs, 'ClaimSet');
    const {args: argsRegister} = findEvent(logs, 'AccountRegistered');

    expect(argsClaim.accountId).to.equal(accountId);
    expect(argsClaim.key).to.equal(padRight(claimKeys.country, 64));
    expect(argsClaim.issuer).to.equal(mainController);
    expect(argsRegister.accountId).to.equal(accountId);
    expect(argsRegister.account).to.equal(investor);
  });

  it('should be called only by the controller', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaimAndRegisterAccount(
        accountId,
        investor,
        claimKeys.country,
        claim,
        {from: nonController}
      ),
      'Only controller role'
    );
  });

  it('should revert if the issuer property is not the same as the sender of the tx', async () => {
    const claim = createClaim('GRC', nonController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaimAndRegisterAccount(
        accountId,
        investor,
        claimKeys.country,
        claim,
        {from: mainController}
      ),
      'Issuer mismatch'
    );
  });

  it('should revert if the claim expiry date is in the past', async () => {
    const claim = createClaim('GRC', mainController, sub(1), 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaimAndRegisterAccount(
        accountId,
        investor,
        claimKeys.country,
        claim,
        {from: mainController}
      ),
      'Claim expiry date is in the past'
    );
  });

  it('should disallow account overrides', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      investor,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    await shouldFailWithMessage(
      claimRegistry.setClaimAndRegisterAccount(
        accountId,
        investor,
        claimKeys.country,
        claim,
        {from: mainController}
      ),
      'Cannot override account'
    );
  });

  it('should register an account with the given accountId', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      investor,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const aId = await claimRegistry.getAccountId(investor);

    expect(aId).to.equal(accountId);
  });

  it('should register multiple accounts with the given accountId', async () => {
    const claim1 = createClaim('claim1', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      investor,
      claimKeys.country,
      claim1,
      {from: mainController}
    );

    const claim2 = createClaim('claim2', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');

    await claimRegistry.setClaimAndRegisterAccount(
      accountId,
      exchange,
      claimKeys.country,
      claim2,
      {from: mainController}
    );

    const aId = await claimRegistry.getAccountId(investor);
    const aId2 = await claimRegistry.getAccountId(exchange);

    expect(aId).to.equal(accountId);
    expect(aId2).to.equal(accountId);
  });
});
