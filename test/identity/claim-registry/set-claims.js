const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {
  deployClaimRegistry,
  createClaim,
  claimKeys,
  decodeClaimValue,
  createAccountId
} = require('../utils');

contract('ClaimRegistry: setClaim', accounts => {
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
    accountId = createAccountId('Pavlos', 'Polianidis');
    accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');

    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId2,
      investor2,
      {from: mainController}
    );
  });

  it('should set the multiple claims with the same key for the multiple users', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'grc-provider', 'grc-provider-proof');
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'gbr-provider', 'gbr-provider-proof');

    await claimRegistry.setClaims(
      [accountId, accountId2],
      [claimKeys.country, claimKeys.country],
      [claim, claim2],
      {from: mainController}
    );

    const {value, issuer, validTo, provider, providerProof} = await claimRegistry.getClaim(investor, claimKeys.country);
    expect(decodeClaimValue(value)).to.equal('GRC');
    expect(issuer).to.equal(mainController);
    expect(Number(validTo)).to.equal(Number.MAX_SAFE_INTEGER);
    expect(decodeClaimValue(provider)).to.equal('grc-provider');
    expect(decodeClaimValue(providerProof)).to.equal('grc-provider-proof');

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
    expect(decodeClaimValue(provider2)).to.equal('gbr-provider');
    expect(decodeClaimValue(providerProof2)).to.equal('gbr-provider-proof');
  });

  it('should be called only by the controller', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'grc-provider', 'grc-provider-proof');
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'gbr-provider', 'gbr-provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaims(
        [accountId, accountId2],
        [claimKeys.country, claimKeys.country],
        [claim, claim2],
        {from: nonController}
      ),
      'Only controller role'
    );
  });
  it('should revert if AccountsIds array length is diferent tha the other two', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'grc-provider', 'grc-provider-proof');
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'gbr-provider', 'gbr-provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaims(
        [accountId, accountId2, accountId2],
        [claimKeys.country, claimKeys.country],
        [claim, claim2],
        {from: mainController}
      ),
      'Array length mismatch'
    );
  });

  it('should revert if Keys array length is different tha the other two', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'grc-provider', 'grc-provider-proof');
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'gbr-provider', 'gbr-provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaims(
        [accountId, accountId2],
        [claimKeys.country, claimKeys.country, claimKeys.country],
        [claim, claim2],
        {from: mainController}
      ),
      'Array length mismatch'
    );
  });
  it('should revert if Claims array length is different tha the other two', async () => {
    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER, 'grc-provider', 'grc-provider-proof');
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER, 'gbr-provider', 'gbr-provider-proof');

    await shouldFailWithMessage(
      claimRegistry.setClaims(
        [accountId, accountId2],
        [claimKeys.country, claimKeys.country],
        [claim, claim2, claim],
        {from: mainController}
      ),
      'Array length mismatch'
    );
  });
});
