const {expect} = require('../../../../../common/test/helpers');
const {getTokens, toHex, hexToBytes} = require('../../../../../common/test/helpers/utils');
const {ZERO_ADDRESS, getTclActors} = require('../../../../../common/test/helpers/address');
const {deployCng1400} = require('../../../helpers/deploy');
const {
  deployCountryLimitCheckpoint, 
  EMPTY_DATA, 
  deployTclRepository, 
  deployTclController
} = require('../../utils');
const {
  deployClaimRegistry,
  claimKeys,
  createClaim,
  createAccountId
} = require('../../../identity/utils');

contract('CountryLimitCheckpoint: postTransfer', accounts => {
  let countryLimitCheckpoint;
  let claimRegistry;
  let token;
  const sender = accounts[2];
  const sender2 = accounts[5];
  const recipient = accounts[3];
  const recipient2 = accounts[4];
  const {mainController, issuer} = getTclActors(accounts);

  const setup = async () => {
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
    const accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');
    const accountId3 = createAccountId('Pav', 'Polia', 'pavlos../../../../../common.io');

    const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
    const claim2 = createClaim('GBR', mainController, Number.MAX_SAFE_INTEGER);
    const claim3 = createClaim('USA', mainController, Number.MAX_SAFE_INTEGER);

    await claimRegistry.setClaims(
      [accountId, accountId2, accountId3],
      [claimKeys.country, claimKeys.country, claimKeys.country],
      [claim, claim2, claim3],
      {from: mainController}
    );

    // register two addresses for accountId
    await claimRegistry.registerAccount(
      accountId,
      sender,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId,
      sender2,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId2,
      recipient,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId3,
      recipient2,
      {from: mainController}
    );

    await countryLimitCheckpoint.addLimits(
      [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
      [1, 1, 3],
      {from: mainController}
    );

    await cng1400.issue(sender, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.issue(recipient, getTokens(100), EMPTY_DATA, {from: issuer});

    await countryLimitCheckpoint.postTransfer(
      ZERO_ADDRESS,
      sender,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    await countryLimitCheckpoint.postTransfer(
      ZERO_ADDRESS,
      recipient,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );
  };

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

  it('should increase the GBR counter by 1', async () => {
    await cng1400.transfer(recipient, getTokens(25), {from: sender});
    await countryLimitCheckpoint.postTransfer(
      sender,
      recipient,
      getTokens(25),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GRC')), {from: mainController});
    const result2 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')), {from: mainController});
    const result3 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('USA')), {from: mainController});

    expect(result.toNumber()).to.equal(1);
    expect(result2.toNumber()).to.equal(1);
    expect(result3.toNumber()).to.equal(0);
  });

  it('should decrease the GBR counter by 1 and increase the USA by 1', async () => {
    await cng1400.transfer(recipient2, getTokens(50), {from: recipient});
    await countryLimitCheckpoint.postTransfer(
      recipient,
      recipient2,
      getTokens(50),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GRC')), {from: mainController});
    const result2 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')), {from: mainController});
    const result3 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('USA')), {from: mainController});

    expect(result.toNumber()).to.equal(1);
    expect(result2.toNumber()).to.equal(1);
    expect(result3.toNumber()).to.equal(1);

    // send the full remaining amount
    await cng1400.transfer(recipient2, getTokens(50), {from: recipient});

    await countryLimitCheckpoint.postTransfer(
      recipient,
      recipient2,
      getTokens(50),  // ... so the counter decreases
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );
    const result4 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')), {from: mainController});
    const result5 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('USA')), {from: mainController});
    
    expect(result4.toNumber()).to.equal(0);
    expect(result5.toNumber()).to.equal(1);
  });

  it('should not update the counter if transfer happens between two addresses of the same account', async () => {
    await cng1400.transfer(sender2, getTokens(100), {from: sender});
    await countryLimitCheckpoint.postTransfer(
      sender,
      sender2,
      getTokens(50),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GRC')), {from: mainController});
    const result2 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')), {from: mainController});
    const result3 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('USA')), {from: mainController});

    expect(result.toNumber()).to.equal(1);
    expect(result2.toNumber()).to.equal(1);
    expect(result3.toNumber()).to.equal(0);

  });

  it('should not decrease unless the account balance across all addresses in zero', async () => {
    await cng1400.issue(sender2, getTokens(50), EMPTY_DATA, {from: issuer});

    // sender from GRC sends the full amount but the country limit should not be decreased because the 
    // sender account i.e accountId has one more addressed registered i.e. sender2 with 50 tokens balance
    await cng1400.transfer(recipient2, getTokens(100), {from: sender});
    await countryLimitCheckpoint.postTransfer(
      sender,
      recipient2,
      getTokens(100),
      EMPTY_DATA,
      cng1400.address,
      {from: mainController}
    );

    const result = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GRC')), {from: mainController});
    const result2 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('GBR')), {from: mainController});
    const result3 = await countryLimitCheckpoint.getInvestorCount(hexToBytes(toHex('USA')), {from: mainController});
    
    expect(result.toNumber()).to.equal(1);
    expect(result2.toNumber()).to.equal(1);
    expect(result3.toNumber()).to.equal(1);
  });
});
