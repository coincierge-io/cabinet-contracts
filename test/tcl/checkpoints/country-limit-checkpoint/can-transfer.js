const {expect, expectBignumberEqual} = require('../../helpers');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../helpers/utils');
const {getTclActors} = require('../../../helpers/address');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');
const {add, fromSolDate} = require('../../../helpers/date');
const {latestTime, increaseTimeTo} = require('../../../helpers/timeUtils');
const {deployCng1400} = require('../../../helpers/deploy');
const {
  deployTclRepository, 
  deployTclController, 
  deployCountryLimitCheckpoint, 
  ethereumStatusCodes, 
  EMPTY_DATA
} = require('../../utils');
const {
  deployClaimRegistry,
  claimKeys,
  createClaim,
  createAccountId,
  registerSpe,
  registerCountry
} = require('../../../identity/utils');

contract('CountryLimitCheckpoint: canTransfer', accounts => {
  let countryLimitCheckpoint;
  let claimRegistry;
  let cng1400;

  const {mainController, spe, issuer} = getTclActors(accounts);
  const grcSender = accounts[2];
  const grcSender2 = accounts[8];
  const gbrRecipient = accounts[3];
  const grcRecipient2 = accounts[4];
  const grcRecipient3 = accounts[5];
  const grcRecipient4 = accounts[6];
  const usaRecipient = accounts[7];
  const grcRecipient5 = accounts[9];

  const setup = async () => {
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
    const accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');
    const accountId3 = createAccountId('Pav', 'Polia', 'pavlos../../../../../common.io');
    const accountId4 = createAccountId('Pav', 'Pol', 'pavlos@mail.io');
    const accountId5 = createAccountId('Pav', 'Polian', 'pavlos@hotmail.io');
    const accountId6 = createAccountId('Pav', 'Polianidi', 'pavlos@hotmail.com');

    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER);
    const claim3 = createClaim('USA', mainController, Number.MAX_SAFE_INTEGER);
    const claim4 = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
    const claim5 = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
    const claim6 = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);

    await claimRegistry.setClaims(
      [accountId, accountId2, accountId3, accountId4, accountId5, accountId6],
      [claimKeys.country, claimKeys.country, claimKeys.country, claimKeys.country, claimKeys.country, claimKeys.country],
      [claim, claim2, claim3, claim4, claim5, claim6],
      {from: mainController}
    );

    // register two addresses under accountId
    await claimRegistry.registerAccount(
      accountId,
      grcSender,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId,
      grcSender2,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId2,
      gbrRecipient,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId3,
      usaRecipient,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId4,
      grcRecipient2,
      {from: mainController}
    );

    // register two accounts for accountId5
    await claimRegistry.registerAccount(
      accountId5,
      grcRecipient3,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId5,
      grcRecipient5,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId6,
      grcRecipient4,
      {from: mainController}
    );
  };

  const reachGRCLimit = async () => {
    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
      [2, 2, 4],
      {from: mainController}
    );


    // fund accounts
    await cng1400.issue(grcSender, getTokens(100), EMPTY_DATA, {from: issuer});

    // make transfers. Replicate that by doing post transfer.
    await cng1400.transfer(grcRecipient2, getTokens(50), {from: grcSender});
    await countryLimitCheckpoint.postTransfer(
      grcSender,
      grcRecipient2,
      getTokens(50),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    await cng1400.transfer(grcRecipient3, getTokens(25), {from: grcRecipient2});
    await countryLimitCheckpoint.postTransfer(
      grcRecipient2,
      grcRecipient3,
      getTokens(25),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );
  }

  beforeEach(async () => {
    const tclRepository = await deployTclRepository(accounts, {account: mainController});
    const tclController = await deployTclController(accounts, {tclRepository: tclRepository.address, account: mainController});
    claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
    countryLimitCheckpoint = await deployCountryLimitCheckpoint(
      accounts,
      {account: mainController, claimRegistry: claimRegistry.address},
      {from: mainController}
    );

    cng1400 = await deployCng1400(accounts, {claimRegistry, tclController});

    await setup();
  });

  it('should allow a transfer if the limits are ok', async () => {
    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
      [10, 10, 10],
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      gbrRecipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');

    const result2 = await countryLimitCheckpoint.canTransfer(
      grcSender,
      usaRecipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result2[0]).to.equal(true);
    expect(result2[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result2[2])).to.equal('');
  });

  it('should allow the transfer of tokens to an existing investor from a country that has reached the limit', async () => {
    await reachGRCLimit();

    // send between existing investors from GRC which reached the limit
    // this should allow the investors to transfer tokens amongst themselves
    const result = await countryLimitCheckpoint.canTransfer(
      grcRecipient3,
      grcRecipient2,
      getTokens(10),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should return false if the country limits are exceeded after a few transfers ocurred', async () => {
    await reachGRCLimit();

    const result = await countryLimitCheckpoint.canTransfer(
      grcRecipient3,
      grcRecipient4,
      getTokens(10),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientCountryLimit);
  });

  it('should return true if a user tries to transfer their entire balance to someone else from the same country which has reached the limit', async () => {
    await reachGRCLimit();
    await cng1400.issue(grcSender, getTokens(100), EMPTY_DATA, {from: issuer});

    // grcRecipient3 want to transfer the entire balance
    const result = await countryLimitCheckpoint.canTransfer(
      grcRecipient3,
      grcRecipient4,
      getTokens(25),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should return false if user with multiple addresses transfers the full balance of just one of his addresses', async () => {
    await reachGRCLimit();

    // accountId5 will no whave 25 + 50 = 75 tokens accross two addresses grcRecipient3 and grcRecipient5
    await cng1400.issue(grcRecipient5, getTokens(50), EMPTY_DATA, {from: issuer});

    const result = await countryLimitCheckpoint.canTransfer(
      grcRecipient3,
      grcRecipient4,
      getTokens(25),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientCountryLimit);
  });

  it('should return true if transfer happens between two addresses with the same account id', async () => {
    await reachGRCLimit();

    const result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      grcSender2,
      getTokens(25),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should revert if recipient limit is reached', async () => {
    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
      [1, 0, 1],
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      gbrRecipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientCountryLimit);
  });

  it('should bypass if recipient is an SPE', async () => {
    let result;

    await registerSpe(claimRegistry, spe, mainController);

    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GBR'))],
      [0],
      {from: mainController}
    );

    result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      gbrRecipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );

    const investorsCountBefore = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')));

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientCountryLimit);

    result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      spe,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');

    // country limits should not change
    const investorsCountAfter = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')));
    expectBignumberEqual(investorsCountBefore, investorsCountAfter);
  });

  it('should return false if country claim has expired', async () => {
    const blockTime = await latestTime();
    const expireDate = add(1, fromSolDate(blockTime.toNumber()));

    await registerCountry(claimRegistry, gbrRecipient, mainController, {value: 'GRC', expireDate});
    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
      [10, 10, 10],
      {from: mainController}
    );

    await increaseTimeTo(
      add(2, fromSolDate(blockTime.toNumber()))
    );

    const result = await countryLimitCheckpoint.canTransfer(
      grcSender,
      gbrRecipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientCountryLimit);
  });
});
