const {expectBignumberEqual, expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, toHex, hexToBytes, getTokens} = require('../../../../common/test/helpers/utils');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {setupCountryLimitCheckpoint} = require('../utils');

contract('erc1594: transferWithData', accounts => {
  let cng1400;
  let blockedAccountCheckpoint;

  const {
    issuer,
    authorisedHolder,
    dodgyGuy,
    mainController
  } = getTclActors(accounts);
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

  beforeEach(async () => {
    ({cng1400, blockedAccountCheckpoint} = await deployAndSetupCng1400(accounts));
  });

  it('should transfer tokens correctly using transferWithData', async () => {
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.transferWithData(issuer, getTokens(100), EMPTY_DATA, {from: authorisedHolder});

    const balance = await cng1400.balanceOf(issuer);
    expectBignumberEqual(balance, getTokens(100));
  });

  it('should revert if transferWithData beneficiary is not authorised', async () => {
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});

    const canTransfer = await cng1400.canTransfer(
      dodgyGuy, getTokens(100), EMPTY_DATA, {from: authorisedHolder}
    );
    expect(canTransfer[0]).to.equal(false);

    await shouldFailWithMessage(
      cng1400.transferWithData(dodgyGuy, getTokens(100), EMPTY_DATA, {from: authorisedHolder}),
      'RECIPIENT_BLOCKED'
    );
  });

  it('should revert if transferWithData sender is not authorised anymore', async () => {
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});
    await blockedAccountCheckpoint.blockAccount(authorisedHolder, {from: mainController});

    const canTransfer = await cng1400.canTransfer(
      issuer, getTokens(100), EMPTY_DATA, {from: authorisedHolder}
    );

    expect(canTransfer[0]).to.equal(false);

    await shouldFailWithMessage(
      cng1400.transferWithData(issuer, getTokens(100), EMPTY_DATA, {from: authorisedHolder}),
      'SENDER_BLOCKED'
    );
  });

  it('should revert if the recipient is from a country that has reached the limit (i.e. countryLimitCheckpoint)', async () => {
    const sender = accounts[2];
    const recipient = accounts[3];
    const recipient2 = accounts[4];

    const {cng1400} = await setupCountryLimitCheckpoint(accounts, sender, recipient, recipient2);

    // limit for the sender and recipient country is 2
    await cng1400.issue(sender, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.transferWithData(recipient, getTokens(100), EMPTY_DATA, {from: sender});

    await shouldFailWithMessage(
      cng1400.transferWithData(recipient2, getTokens(50), EMPTY_DATA, {from: recipient}),
      'RECIPIENT_COUNTRY_LIMIT'
    );
  });
});
