const {expect} = require('../../helpers');
const {
  getTokens,
  toHex,
  hexToBytes,
  hexToUtf8
} = require('../../../helpers/utils');
const {
  deployAccreditedInvestorCheckpoint,
  ethereumStatusCodes
} = require('../../utils');
const {
  deployClaimRegistry,
  registerSpe,
  registerKyc,
  registerCountry,
  registerAccreditedInvestor
} = require('../../../identity/utils');
const {add, fromSolDate} = require('../../../helpers/date');
const {getTclActors} = require('../../../helpers/address');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {latestTime, increaseTimeTo} = require('../../../helpers/timeUtils');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');

contract('AccreditedInvestorCheckpoint: canTransfer', accounts => {
  let accreditedInvestorChekpoint;
  let claimRegistry;
  let token;

  const {mainController, spe} = getTclActors(accounts);
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    const params = {account: mainController};
    claimRegistry = await deployClaimRegistry(accounts, params);
    token = await deployCappedMintableToken(accounts);

    accreditedInvestorChekpoint = await deployAccreditedInvestorCheckpoint(
      accounts,
      claimRegistry.address,
      params
    );
  });

  it('should return true if both sender and recipient are americans and accredited investors', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'USA'});
    await registerCountry(claimRegistry, recipient, mainController, {value: 'USA'});

    await registerAccreditedInvestor(claimRegistry, sender, mainController);
    await registerAccreditedInvestor(claimRegistry, recipient, mainController);

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });

  it('should return true with non-american sender and american accredited recipient', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'GBR'});

    await registerCountry(claimRegistry, recipient, mainController, {value: 'USA'});
    await registerAccreditedInvestor(claimRegistry, recipient, mainController);

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });

  it('should return true if both sender and recipient are not americans', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'GBR'});
    await registerCountry(claimRegistry, recipient, mainController, {value: 'GBR'});

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });

  it('should return true with american accredited sender and non american recipient', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'USA'});
    await registerAccreditedInvestor(claimRegistry, sender, mainController);

    await registerCountry(claimRegistry, recipient, mainController, {value: 'GBR'});

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });

  it('should return false with american non-accredited sender and non american recipient', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'USA'});

    await registerCountry(claimRegistry, recipient, mainController, {value: 'GBR'});

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderIsNotAccredited);
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
  });

  it('should return false with non-american sender and american non-accredited recipient', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'GBR'});

    await registerCountry(claimRegistry, recipient, mainController, {value: 'USA'});

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientIsNotAccredited);
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
  });

  it('should return false if sender has a claim in ClaimRegistry but recipient has not', async () => {
    await registerCountry(claimRegistry, sender, mainController, {value: 'USA'});
    await registerAccreditedInvestor(claimRegistry, sender, mainController);

    await registerCountry(claimRegistry, recipient, mainController, {value: 'USA'});

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal(checkpointError.recipientIsNotAccredited);
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
  });

  it('should return false if isAccreditedInvestor claim has expired', async () => {
    const blockTime = await latestTime();
    const expireDate = add(1, fromSolDate(blockTime.toNumber()));

    await registerCountry(claimRegistry, sender, mainController, {value: 'USA'});
    await registerAccreditedInvestor(
      claimRegistry,
      sender,
      mainController,
      {expireDate}
    );

    await increaseTimeTo(
      add(2, fromSolDate(blockTime.toNumber()))
    );

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderIsNotAccredited);
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
  });

  it('should return false if USA country claim has expired', async () => {
    const blockTime = await latestTime();
    const expireDate = add(1, fromSolDate(blockTime.toNumber()));

    await registerAccreditedInvestor(claimRegistry, sender, mainController);
    await registerCountry(
      claimRegistry,
      sender,
      mainController,
      {value: 'USA', expireDate}
    );

    await increaseTimeTo(
      add(2, fromSolDate(blockTime.toNumber()))
    );

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );
    expect(hexToUtf8(result[2])).to.equal(checkpointError.senderIsNotAccredited);
    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
  });

  it('should bypass checks if from is a SPE address', async () => {
    await registerSpe(claimRegistry, spe, mainController);

    const result = await accreditedInvestorChekpoint.canTransfer(
      spe,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });

  it('should bypass checks if to is a SPE address', async () => {
    await registerKyc(claimRegistry, sender, mainController);
    await registerSpe(claimRegistry, spe, mainController);

    const result = await accreditedInvestorChekpoint.canTransfer(
      sender,
      spe,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(hexToUtf8(result[2])).to.equal('');
    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
  });
});
