const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {
  deployClaimRegistry,
  createClaim,
  claimKeys,
  decodeClaimValue,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: setClaimsAndRegisterAccount', accounts => {
  let claimRegistry;
  let accountId;

  const mainController = accounts[1];
  const nonController = accounts[3];
  const investor = accounts[4];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
    accountId = createAccountId('Pavlos', 'Polianidis');
  });

  it('should register multiple accounts and set the multiple claims', async () => {
    const countryClaim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'Country Provider', 'country-provider-proof');
    const kycClaim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER, 'kyc provider', 'kyc-provider-proof');

    await claimRegistry.setClaimsAndRegisterAccount(
      accountId,
      investor,
      [claimKeys.country, claimKeys.kycAml],
      [countryClaim, kycClaim],
      {from: mainController}
    );

    const {
      value,
      issuer,
      validTo,
      provider,
      providerProof
    } = await claimRegistry.getClaim(investor, claimKeys.country);
    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('Country Provider');
    expect(decodeClaimValue(providerProof)).to.equal('country-provider-proof');

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
    expect(decodeClaimValue(provider2)).to.equal('kyc provider');
    expect(decodeClaimValue(providerProof2)).to.equal('kyc-provider-proof');

    const aId = await claimRegistry.getAccountId(investor);
    const aId2 = await claimRegistry.getAccountId(investor);
    expect(aId).to.equal(accountId);
    expect(aId2).to.equal(accountId);
  });

  it('should be called only by the controller', async () => {
    const countryClaim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'country provider', 'country-provider-proof');
    const kycClaim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER, 'kyc-provider', 'kyc-provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaimsAndRegisterAccount(
        accountId,
        investor,
        [claimKeys.country, claimKeys.kycAml],
        [countryClaim, kycClaim],
        {from: nonController}
      ),
      'Only controller role'
    );
  });

  it('should revert if the arrays` lenghts do not match', async () => {
    const countryClaim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'country provider', 'provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaimsAndRegisterAccount(
        accountId,
        investor,
        [claimKeys.country, claimKeys.kycAml],
        [countryClaim],
        {from: mainController}
      ),
      'Array length mismatch'
    );
  });
});
