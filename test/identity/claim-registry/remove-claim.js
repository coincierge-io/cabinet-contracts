const {expect} = require('../../helpers');
const {shouldFailWithMessage, bytesToHex, padRight} = require('../../helpers/utils');
const {ZERO_ADDRESS} = require('../../helpers/address');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry,
  createClaim,
  claimKeys,
  decodeClaimValue,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: removeClaim', accounts => {
  let claimRegistry;
  let accountId;
  let accountId2;

  const mainController = accounts[1];
  const nonController = accounts[3];
  const investor = accounts[4];
  const investor2 = accounts[5];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);

    await claimRegistry.registerAccount(
      createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com'),
      investor,
      {from: mainController}
    );

    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');
    await claimRegistry.setClaim(
      accountId2,
      claimKeys.country,
      claim2,
      {from: mainController}
    );
  });

  it('should remove a claim for the given account', async () => {
    await claimRegistry.removeClaim(
      accountId,
      claimKeys.country,
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);
    expect(decodeClaimValue(value)).to.equal('');
    expect(issuer).to.equal(ZERO_ADDRESS);
    expect(Number(validTo)).to.equal(0);
    expect(decodeClaimValue(provider)).to.equal('');
    expect(decodeClaimValue(providerProof)).to.equal('');
  });

  it('should remove a claim for the multiple accounts', async () => {
    await claimRegistry.removeClaim(
      accountId,
      claimKeys.country,
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);
    expect(decodeClaimValue(value)).to.equal('');
    expect(issuer).to.equal(ZERO_ADDRESS);
    expect(Number(validTo)).to.equal(0);
    expect(decodeClaimValue(provider)).to.equal('');
    expect(decodeClaimValue(providerProof)).to.equal('');

    await claimRegistry.removeClaim(
      accountId2,
      claimKeys.country,
      {from: mainController}
    );
    const {
      value: value2,
      issuer: issuer2,
      validTo: validTo2,
      provider: provider2,
      providerProof: providerProof2
    } = await claimRegistry.getClaim(investor2, claimKeys.country);
    expect(decodeClaimValue(value2)).to.equal('');
    expect(issuer2).to.equal(ZERO_ADDRESS);
    expect(Number(validTo2)).to.equal(0);
    expect(decodeClaimValue(provider2)).to.equal('');
    expect(decodeClaimValue(providerProof2)).to.equal('');
  });
  
  it('should emit ClaimRemoved', async () => {
    const {receipt: {logs}} = await claimRegistry.removeClaim(
      accountId,
      claimKeys.country,
      {from: mainController}
    );

    const {args} = findEvent(logs, 'ClaimRemoved');

    expect(args.accountId).to.equal(accountId);
    expect(args.key).to.equal(padRight(claimKeys.country, 64));
    expect(args.issuer).to.equal(mainController);
  });

  it('should be called only by the controller', async () => {
    await shouldFailWithMessage(
      claimRegistry.removeClaim(
        accountId,
        claimKeys.country,
        {from: nonController}
      ),
      'Only controller role'
    );
  });
});
