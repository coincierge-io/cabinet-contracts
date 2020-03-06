const {expect} = require('../../helpers');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../helpers/utils');
const {deployKycAmlCheckpoint, ethereumStatusCodes} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {add} = require('../../../helpers/date');
const {increaseTimeTo} = require('../../../helpers/timeUtils');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');
const {
  deployClaimRegistry,
  createAccountId,
  createClaim,
  claimKeys,
  registerSpe,
  registerKyc
} = require('../../../identity/utils');

contract('KycAmlCheckpoint: canTransfer', accounts => {
  let kycAmlCheckpoint;
  let token;
  let claimRegistry;

  const mainController = accounts[1];
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
    token = await deployCappedMintableToken(accounts);

    kycAmlCheckpoint = await deployKycAmlCheckpoint(
      accounts,
      claimRegistry.address,
      params
    );
  });

  it('should return true if both sender and recipient have a claim in ClaimRegistry', async () => {
    await registerKyc(claimRegistry, recipient, mainController);
    await registerKyc(claimRegistry, sender, mainController);

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

  it('should return false if sender has a claim in ClaimRegistry but recipient has not', async () => {
    await registerKyc(claimRegistry, sender, mainController);

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientKycNotValid);
  });

  it('should return false if recipient has a claim in ClaimRegistry but sender has not', async () => {
    await registerKyc(claimRegistry, recipient, mainController);

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderKycNotValid);
  });

  it('should return false if claim has expired', async () => {
    const claim = createClaim('1', mainController, add(1));
    const senderAccountId = createAccountId(sender);
    const recipientAccountId = createAccountId(recipient);

    await claimRegistry.registerAccount(
      senderAccountId,
      sender,
      {from: mainController}
    );
    await claimRegistry.registerAccount(
      recipientAccountId,
      recipient,
      {from: mainController}
    );

    await claimRegistry.setClaim(
      senderAccountId,
      claimKeys.kycAml,
      claim,
      {from: mainController}
    );

    await claimRegistry.setClaim(
      recipientAccountId,
      claimKeys.kycAml,
      claim,
      {from: mainController}
    );

    await increaseTimeTo(add(2));

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderKycNotValid);
  });

  it('should bypass checks if from is a SPE address', async () => {
    const speAddress = accounts[5];
    await registerKyc(claimRegistry, recipient, mainController);
    await registerSpe(claimRegistry, speAddress, mainController);

    const result = await kycAmlCheckpoint.canTransfer(
      speAddress,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should bypass checks if to is a SPE address', async () => {
    const speAddress = accounts[5];
    await registerKyc(claimRegistry, sender, mainController);
    await registerSpe(claimRegistry, speAddress, mainController);

    const result = await kycAmlCheckpoint.canTransfer(
      sender,
      speAddress,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });
});
