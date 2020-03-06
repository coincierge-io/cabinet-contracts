const {expect} = require('../../../../../common/test/helpers');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../../../common/test/helpers/utils');
const {deployBlockAccountCheckpoint, ethereumStatusCodes} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');

contract('BlockAccountCheckpoint: canTransfer', accounts => {
  let blockAccountCheckpoint;
  let token

  const mainController = accounts[1];
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    token = await deployCappedMintableToken(accounts);
    blockAccountCheckpoint = await deployBlockAccountCheckpoint(
      accounts,
      {account: mainController}
    );
  });

  it('should return true if both sender and recipient are not blocked', async () => {
    const result = await blockAccountCheckpoint.canTransfer(
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

  it('should return false if sender is blocked but recipient is not', async () => {
    await blockAccountCheckpoint.blockAccount(sender, {from: mainController});

    const result = await blockAccountCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderBlocked);
  });

  it('should return false if recipient is blocked but sender is not', async () => {
    await blockAccountCheckpoint.blockAccount(recipient, {from: mainController});

    const result = await blockAccountCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientBlocked);
  });
});
