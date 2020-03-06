const ClaimRegistry = artifacts.require('ClaimRegistry');
const {expect} = require('../../helpers');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../helpers/utils');
const {getTclActors} = require('../../../helpers/address');
const {deployInvestorLimitCheckpoint, ethereumStatusCodes} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {checkpointError} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');
const {registerSpe} = require('../../../identity/utils');

contract('InvestorLimitCheckpoint: canTransfer', accounts => {
  let investorLimitCheckpoint;
  let claimRegistry;
  let token;
  const {mainController} = getTclActors(accounts);
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    token = await deployCappedMintableToken(accounts);
    investorLimitCheckpoint = await deployInvestorLimitCheckpoint(
      accounts,
      {account: mainController, tokenAddress: token.address}
    );

    const claimRegistryAddress = await investorLimitCheckpoint.claimRegistry();
    claimRegistry = await ClaimRegistry.at(claimRegistryAddress);
  });

  it('should allow a transfer if the limit is ok', async () => {
    await token.mint(recipient, getTokens(50));

    await investorLimitCheckpoint.setLimit(
      getTokens(100),
      {from: mainController}
    );

    const result = await investorLimitCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(30),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should revert if recipient limit is reached', async () => {
    await token.mint(recipient, getTokens(50));

    await investorLimitCheckpoint.setLimit(
      getTokens(100),
      {from: mainController}
    );

    const result = await investorLimitCheckpoint.canTransfer(
      sender,
      recipient,
      getTokens(51),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal(checkpointError.investorBalanceLimit);
  });

  it('should bypass checks if to is a SPE address', async () => {
    const speAddress = accounts[5];
    await registerSpe(claimRegistry, speAddress, mainController);

    await token.mint(recipient, getTokens(50));

    await investorLimitCheckpoint.setLimit(
      getTokens(100),
      {from: mainController}
    );

    const result = await investorLimitCheckpoint.canTransfer(
      sender,
      speAddress,
      getTokens(51),
      hexToBytes(toHex('empty_bytes_data')),
      token.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });
});
