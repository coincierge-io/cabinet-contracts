const {expect} = require('../../../helpers');
const {hexToUtf8, toHex, hexToBytes, getTokens} = require('../../helpers/utils');
const {getTclActors, getDefaultAddress, ZERO_ADDRESS} = require('../../helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {ethereumStatusCodes} = require('../../tcl/utils');

contract('erc1594: canTransferFrom', accounts => {
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

  it('canTransferFrom should show correct values', async () => {
    const authorisedHolder2 = getDefaultAddress(accounts);
    let canTransferFrom;


    await cng1400.issue(authorisedHolder2, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});

    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder2, authorisedHolder, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(true);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('');

    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder, authorisedHolder2, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(true);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('');

    await blockedAccountCheckpoint.blockAccount(authorisedHolder, {from: mainController});
    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder, authorisedHolder2, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(false);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('SENDER_BLOCKED');

    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder2, authorisedHolder, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(false);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('RECIPIENT_BLOCKED');

    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder2, dodgyGuy, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(false);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('RECIPIENT_BLOCKED');

    canTransferFrom = await cng1400.canTransferFrom(authorisedHolder2, unknownAddress, getTokens(100), EMPTY_DATA);
    expect(canTransferFrom[0]).is.equal(false);
    expect(canTransferFrom[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransferFrom[2])).to.equal('RECIPIENT_KYC_NOT_VALID');
  });

  it('should show return an error message if the senders balance is insufficient', async () => {
    const sender = getDefaultAddress(accounts);
    await cng1400.issue(sender, getTokens(100), EMPTY_DATA, {from: issuer});

    const canTransfer = await cng1400.canTransferFrom(sender, authorisedHolder, getTokens(101), EMPTY_DATA);

    expect(canTransfer[0]).is.equal(false);
    expect(canTransfer[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(canTransfer[2])).to.equal('INSUFFICIENT_BALANCE');
  });
});
