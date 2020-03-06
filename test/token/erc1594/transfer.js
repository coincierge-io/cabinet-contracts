const CNG1400 = artifacts.require('CNG1400');
const Bytes32Utils = artifacts.require('Bytes32Utils');
const {expectBignumberEqual} = require('../../../../common/test/helpers');
const {toHex, hexToBytes, getTokens, shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployClaimRegistry} = require('../../identity/utils');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {setupCountryLimitCheckpoint} = require('../utils');
const {deployTclControllerWithComplexExecutionPlan} = require('../utils');

contract('erc1594: transfer', accounts => {
  let cng1400;

  const {
    issuer,
    authorisedHolder,
    dodgyGuy
  } = getTclActors(accounts);

  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

  beforeEach(async () => {
    ({cng1400} = await deployAndSetupCng1400(accounts));
  });

  it('should revert if recipient is not authorised', async () => {
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});

    await shouldFailWithMessage(
      cng1400.transfer.call(dodgyGuy, getTokens(100), {from: authorisedHolder}),
      'RECIPIENT_BLOCKED'
    );
  });

  it('should transfer tokens correctly', async () => {
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.transfer(issuer, getTokens(100), {from: authorisedHolder});

    const balance = await cng1400.balanceOf(issuer);
    expectBignumberEqual(balance, getTokens(100));
  });

  it('should revert if the recipient is from a country that has reached the limit (i.e. countryLimitCheckpoint)', async () => {
    const sender = accounts[2];
    const recipient = accounts[3];
    const recipient2 = accounts[4];
    
    const {cng1400} = await setupCountryLimitCheckpoint(accounts, sender, recipient, recipient2);

    // limit for the sender and recipient country is 2
    await cng1400.issue(sender, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.transfer(recipient, getTokens(100), {from: sender});

    await shouldFailWithMessage(
      cng1400.transfer(recipient2, getTokens(50), {from: recipient}),
      'RECIPIENT_COUNTRY_LIMIT'
    );
  });

  it('should work with a complex execution plan', async () => {
    const {issuer, authorisedHolder, mainController} = getTclActors(accounts);
    const tclController = await deployTclControllerWithComplexExecutionPlan(accounts, 75);
    const claimRegistry = await deployClaimRegistry(accounts);
    const bytes32Utils = await Bytes32Utils.new();
    
    CNG1400.link('Bytes32Utils', bytes32Utils.address);
    const cng1400 = await CNG1400.new(
      tclController.address,
      claimRegistry.address,
      issuer, 
      'Controlled Token', 
      'CTRT', 
      18
    );

    // top up the account
    await cng1400.issue(
      authorisedHolder,
      getTokens(100),
      EMPTY_DATA,
      {from: issuer}
    );

    await cng1400.transfer(issuer, getTokens(100), {from: authorisedHolder});
  })
});
