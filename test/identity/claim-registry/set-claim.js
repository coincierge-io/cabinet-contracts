const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, bytesToHex, padRight} = require('../../../../common/test/helpers/utils');
const {add, sub} = require('../../../../common/test/helpers/date');
const {increaseTimeTo} = require('../../../../common/test/helpers/timeUtils');
const {findEvent} = require('../../helpers/events');
const {
  deployClaimRegistry,
  createClaim,
  claimKeys,
  decodeClaimValue,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: setClaim', accounts => {
  let claimRegistry;

  const mainController = accounts[1];
  const exchange = accounts[2];
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
  });

  it('should set the given claim for the provided user', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);

    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('Claim Provider');
    expect(decodeClaimValue(providerProof)).to.equal('provider-proof');
  });

  it('should emit ClaimSet when a claim is added', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    const {receipt: {logs}} = await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const {args} = findEvent(logs, 'ClaimSet');

    expect(args.accountId).to.equal(accountId);
    expect(args.key).to.equal(padRight(claimKeys.country, 64));
    expect(args.issuer).to.equal(mainController);
  });

  it('should set the multiple claims for the provided user', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider0', 'provider-proof0');
    const claim2 = createClaim('1', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider1', 'provider-proof1');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    await claimRegistry.setClaim(
      accountId,
      claimKeys.kycAml,
      claim2,
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);

    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('Claim Provider0');
    expect(decodeClaimValue(providerProof)).to.equal('provider-proof0');

    const {
      value: value2,
      issuer: issuer2,
      validTo: validTo2,
      provider: provider2,
      providerProof: providerProof2
    } = await claimRegistry.getClaim(investor, claimKeys.kycAml);

    expect(decodeClaimValue(value2)).to.equal('1');
    expect(issuer2).to.equal(mainController);
    expect(Number(validTo2)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider2)).to.equal('Claim Provider1');
    expect(decodeClaimValue(providerProof2)).to.equal('provider-proof1');
  });

  it('should update the claims for multiple users if called multiple times', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const {value, issuer, validTo,  provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);
    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('Claim Provider');
    expect(decodeClaimValue(providerProof)).to.equal('provider-proof');

    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider2', 'provider-proof2');
    const accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');

    await claimRegistry.setClaim(
      accountId2,
      claimKeys.country,
      claim2,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId2,
      investor2,
      {from: mainController}
    );

    const {
      value: value2,
      issuer: issuer2,
      validTo: validTo2,
      provider: provider2,
      providerProof: providerProof2
    } = await claimRegistry.getClaim(investor2, claimKeys.country);
    expect(decodeClaimValue(value2)).to.equal('GBR');
    expect(issuer2).to.equal(mainController);
    expect(Number(validTo2)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider2)).to.equal('Claim Provider2');
    expect(decodeClaimValue(providerProof2)).to.equal('provider-proof2');
  });

  it('should be called only by the controller', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaim(
        accountId,
        claimKeys.country,
        claim,
        {from: nonController}
      ),
      'Only controller role'
    );
  });

  it('should revert if the issuer property is not the same as the sender of the tx', async () => {
    const claim = createClaim('GRC', nonController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaim(
        accountId,
        claimKeys.country,
        claim,
        {from: mainController}
      ),
      'Issuer mismatch'
    );
  });

  it('should revert if the claim expiry date is in the past', async () => {
    const claim = createClaim('GRC', mainController, sub(1), 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await shouldFailWithMessage(
      claimRegistry.setClaim(
        accountId,
        claimKeys.country,
        claim,
        {from: mainController}
      ),
      'Claim expiry date is in the past'
    );
  });

  it('should revert if a non issuer tries to override an existing claim for an account', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    // allow the exchange to add claims
    await claimRegistry.addController(
      exchange,
      {from: mainController}
    );

    // main controller adds a new claim
    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    const claim2 = createClaim('GRC', exchange, Number.MAX_SAFE_INTEGER, 'Claim Provider', 'provider-proof');
    await shouldFailWithMessage(
      claimRegistry.setClaim(
        accountId,
        claimKeys.country,
        claim2,
        {from: exchange}
      ),
      'Cannot override claim'
    );
  });

  it('should allow claim overrides if the claim has expired', async () => {
    const expiry = add(1);
    const claim = createClaim('GRC', mainController, expiry, 'Claim Provider', 'provider-proof');
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    // allow the exchange to add claims
    await claimRegistry.addController(
      exchange,
      {from: mainController}
    );

    // main controller adds a new claim
    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim,
      {from: mainController}
    );

    await increaseTimeTo(add(2));

    // since claim expired any controller can override it
    const newExpiry = add(5);
    const claim2 = createClaim('GBR', exchange, newExpiry, 'Claim ProviderGBR', 'provider-proofGBR');
    await claimRegistry.setClaim(
      accountId,
      claimKeys.country,
      claim2,
      {from: exchange}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);

    expect(decodeClaimValue(value)).to.equal('GBR');
    expect(issuer).to.equal(exchange);
    expect(Number(validTo)).to.equal(newExpiry);
    expect(decodeClaimValue(provider)).to.equal('Claim ProviderGBR');
    expect(decodeClaimValue(providerProof)).to.equal('provider-proofGBR');
  });
});
