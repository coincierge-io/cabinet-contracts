const CappedMintableToken = artifacts.require('CappedMintableToken')
const TokenDistribution = artifacts.require('TokenDistribution')
const EthEscrow = artifacts.require('EthEscrow')
const StablecoinEscrow = artifacts.require('StablecoinEscrow')
const {expect} = require('../../../../common/test/helpers')
const {deployEscrowManager, tokenAvailableForSaleInMillions} = require('../../helpers/deploy')
const {getContributor, getDefaultAddress} = require('../../../../common/test/helpers/address')
const {findEvent} = require('../../helpers/events')
const {
  shouldFailWithMessage,
  moveToClosingTime,
  million
} = require('../../../../common/test/helpers/utils')

contract('EscrowManager: finalize', accounts => {
  let escrowManager;
  let ethEscrow;
  let stablecoinEscrow;

  beforeEach(async () => {
    escrowManager = await deployEscrowManager(accounts);

    const ethEscrowAddress = await escrowManager.ethEscrow();
    ethEscrow = await EthEscrow.at(ethEscrowAddress);

    const stablecoinEscrowAddress = await escrowManager.stablecoinEscrow();
    stablecoinEscrow = await StablecoinEscrow.at(stablecoinEscrowAddress);
  })

  it('should mint the given amount and transfer to the token distribution smart contract', async () => {
    const tokenSold = 10000;
    await escrowManager.finalize(tokenSold);

    const tokenDistribution = await escrowManager.tokenDistribution();
    const erc20 = await escrowManager.erc20();
    cappedMintableTokenInstance = await CappedMintableToken.at(erc20);

    const tokenDistributionBalance = await cappedMintableTokenInstance.balanceOf(tokenDistribution);
    
    expect(tokenDistributionBalance.toNumber()).to.equal(tokenSold);
  })

  it('should call the ethEscrow terminate function', async () => {
    await escrowManager.finalize(10000);
    const isTerminated = await ethEscrow.isTerminated();

    expect(isTerminated).to.be.true;
  })

  it('should call the stablecoinEscrow terminate function', async () => {
    await escrowManager.finalize(1000);
    const isTerminated = await stablecoinEscrow.isTerminated();

    expect(isTerminated).to.be.true;
  })

  it('should set isFinalized to true', async () => {
    const tokenSold = 10000;
    await escrowManager.finalize(tokenSold);
    const isFinalized = await escrowManager.isFinalized.call();

    expect(isFinalized).to.equal(true);
  })

  it('should add the owner of this contract as a new minter of erc20 contract', async () => {
    const tokenSold = 10000;
    const erc20 = await escrowManager.erc20();
    await escrowManager.finalize(tokenSold);
  
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);
    const isMinter = await cappedMintableTokenInstance.isMinter(getDefaultAddress(accounts));
    
    expect(isMinter).to.equal(true);
  })

  it('should transfer the ownership of the token distribution contract to the owner of the this contract', async () => {
    const tokenSold = 10000;
    const tokenDistribution = await escrowManager.tokenDistribution();
    await escrowManager.finalize(tokenSold);
    
    const TokenDistributionInstance = await TokenDistribution.at(tokenDistribution);
    const tokenDistributionOwner = await TokenDistributionInstance.owner();
    
    expect(tokenDistributionOwner).to.equal(getDefaultAddress(accounts));
  })

  it('should emit Complete event', async () => {
    const tokenSold = 10000;
    const {receipt: {logs}} = await escrowManager.finalize(tokenSold);
    const logContent = findEvent(logs, 'Complete');

    expect(logContent).to.not.equal(undefined);
  })

  it('should be called by non-owners if closing time passed expired', async () => {
    await moveToClosingTime(ethEscrow);
    await moveToClosingTime(stablecoinEscrow);
    await escrowManager.finalize(10000, {from: getContributor(accounts, 1)});

    const isFinalized = await escrowManager.isFinalized.call();

    expect(isFinalized).to.equal(true);
  })

  it('should revert if invoked by non-owner before the closing time', async () => {
    const tokenSold = 10000;

    await shouldFailWithMessage(
      escrowManager.finalize(tokenSold, {from: getContributor(accounts, 1)}),
      'Non-owners can invoke after the closing time'
    )
  })

  it('should revert if the given token amount if greater than the total available tokens for sale', async () => {
    const manyTokens = million(tokenAvailableForSaleInMillions + 1);
    
    await shouldFailWithMessage(
      escrowManager.finalize(manyTokens),
      'token to be minted cannot be more that tokens available for sale'
    );
  })

  it('should revert if it is already finalized', async () => {
    await escrowManager.finalize(10000);

    await shouldFailWithMessage(
      escrowManager.finalize(10000),
      `Cannot finalize bacause it's already been finalized`
    );
  })
})
