const {getTclActors, getDefaultAddress} = require('../../helpers/address');
const {hexToUtf8, toHex, hexToBytes, getTokens} = require('../../helpers/utils');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {expect} = require('../../../helpers');
const {ethereumStatusCodes} = require('../../tcl/utils');

contract('erc1594: canTransfer', accounts => {
  let cng1400;
  let blockedAccountCheckpoint;
  const {
    issuer,
    authorisedHolder,
    dodgyGuy,
    mainController,
    unknownAddress
  } = getTclActors(accounts);

  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

  beforeEach(async () => {
    ({cng1400, blockedAccountCheckpoint} = await deployAndSetupCng1400(accounts));
  });

  it('should show correct values', async () => {
    const sender = getDefaultAddress(accounts);
    let canTransfer;

    await cng1400.issue(sender, getTokens(100), EMPTY_DATA, {from: issuer});

    canTransfer = await cng1400.canTransfer(issuer, getTokens(10), EMPTY_DATA, {from: sender});
    expect(canTransfer[0]).is.equal(true);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('');

    canTransfer = await cng1400.canTransfer(authorisedHolder, getTokens(10), EMPTY_DATA, {from: sender});
    expect(canTransfer[0]).is.equal(true);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('');

    await blockedAccountCheckpoint.blockAccount(authorisedHolder, {from: mainController});
    canTransfer = await cng1400.canTransfer(authorisedHolder, getTokens(10), EMPTY_DATA, {from: sender});
    expect(canTransfer[0]).is.equal(false);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('RECIPIENT_BLOCKED');

    await blockedAccountCheckpoint.blockAccount(dodgyGuy, {from: mainController});
    canTransfer = await cng1400.canTransfer(dodgyGuy, getTokens(10), EMPTY_DATA, {from: sender});
    expect(canTransfer[0]).is.equal(false);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('RECIPIENT_BLOCKED');

    canTransfer = await cng1400.canTransfer(unknownAddress, getTokens(10), EMPTY_DATA, {from: sender});
    expect(canTransfer[0]).is.equal(false);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('RECIPIENT_KYC_NOT_VALID');
  });

  it('should show return an error message if the senders balance is insufficient', async () => {
    const sender = getDefaultAddress(accounts);
    await cng1400.issue(sender, getTokens(100), EMPTY_DATA, {from: issuer});

    const canTransfer = await cng1400.canTransfer(authorisedHolder, getTokens(101), EMPTY_DATA, {from: sender});

    expect(canTransfer[0]).is.equal(false);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('INSUFFICIENT_BALANCE');
  });
});
