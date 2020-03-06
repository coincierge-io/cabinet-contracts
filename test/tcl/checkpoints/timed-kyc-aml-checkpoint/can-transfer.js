const {expect} = require('../../helpers');
const {add} = require('../../../helpers/date');
const {increaseTimeTo, latestTime} = require('../../../helpers/timeUtils');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../helpers/utils');
const {deployTimedKycAmlCheckpoint, ethereumStatusCodes} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');

contract('TimedKycAmlCheckpoint: canTransfer', accounts => {
  const expiryData = add(2);
  let kycAmlCheckpoint;
  let token;

  const mainController = accounts[1];
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    token = await deployCappedMintableToken(accounts);
    kycAmlCheckpoint = await deployTimedKycAmlCheckpoint(
      accounts,
      {account: mainController}
    );
  });

  it('should return true if both sender and recipient are in the register', async () => {
    await kycAmlCheckpoint.updateRegister(
      sender,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    await kycAmlCheckpoint.updateRegister(
      recipient,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should return false if sender is in the register but recipient is not', async () => {
    await kycAmlCheckpoint.updateRegister(
      sender,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientKycNotFound);
  });

  it('should return false if recipient is in the register but sender is not', async () => {
    await kycAmlCheckpoint.updateRegister(
      recipient,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderKycNotFound);
  });

  it('should return false if sender kyc and aml is expired', async () => {
    await kycAmlCheckpoint.updateRegister(
      sender,
      add(2),
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    // recipient is ok
    await kycAmlCheckpoint.updateRegister(
      recipient,
      add(4),
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    await increaseTimeTo(add(3));

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderKycExpired);
  });

  it('should return false if recipient kyc and aml is expired', async () => {
    const blockTime = await latestTime();


    // sender is ok
    await kycAmlCheckpoint.updateRegister(
      sender,
      blockTime.toNumber() + 1000,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    await kycAmlCheckpoint.updateRegister(
      recipient,
      blockTime.toNumber() + 500,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    await increaseTimeTo(blockTime.toNumber() + 600);

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientKycExpired);
  });
});
