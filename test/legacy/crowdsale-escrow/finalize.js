const CappedMintableToken = artifacts.require('CappedMintableToken')
const TokenDistribution = artifacts.require('TokenDistribution')
const {expect} = require('../../../../common/test/helpers')
const {deployCrowdsaleEscrow, tokenAvailableForSaleInMillions} = require('../../helpers/deploy')
const {getContributor, getDefaultAddress, getWalletAddress} = require('../../../../common/test/helpers/address')
const {findEvent} = require('../../helpers/events')
const {
  toWei, 
  expectVMException,
  balanceDeltaAfterAction, 
  million, 
  moveToOpeningTime
} = require('../../../../common/test/helpers/utils')

contract('CrowdsaleEscrow: finalize', accounts => {
  let crowdsaleEscrow;

  beforeEach(async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
    await moveToOpeningTime(crowdsaleEscrow)
  })

  it('should mint the given amount and transfer to the token distribution smart contract', async () => {
    const tokenSold = 10000;
    await crowdsaleEscrow.finalize(tokenSold);

    const tokenDistribution = await crowdsaleEscrow.tokenDistribution();
    const erc20 = await crowdsaleEscrow.erc20();
    cappedMintableTokenInstance = await CappedMintableToken.at(erc20);

    const tokenDistributionBalance = await cappedMintableTokenInstance.balanceOf(tokenDistribution);
    
    expect(tokenDistributionBalance.toNumber()).to.equal(tokenSold);
  })

  it('should transfer the funds to the given wallet address', async () => {
    const tokenSold = 10000;
    
    await crowdsaleEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    })

    const walletBalanceDelta = await balanceDeltaAfterAction(
      getWalletAddress(accounts), 
      () => crowdsaleEscrow.finalize(tokenSold),
      false
    );

    expect(walletBalanceDelta.toString()).to.equal(toWei(1, 'ether'));
  })

  it('should set isFinalized to true', async () => {
    const tokenSold = 10000;
    await crowdsaleEscrow.finalize(tokenSold);
    const isFinalized = await crowdsaleEscrow.isFinalized.call();

    expect(isFinalized).to.equal(true);
  })

  it('should add the owner of this contract as a new minter of erc20 contract', async () => {
    await crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)});
    const tokenSold = 10000;
    const erc20 = await crowdsaleEscrow.erc20();
    await crowdsaleEscrow.finalize(tokenSold);
  
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);
    const isMinter = await cappedMintableTokenInstance.isMinter(getDefaultAddress(accounts));
    
    expect(isMinter).to.equal(true);
  })

  it('should transfer the ownership of the token distribution contract to the owner of the this contract', async () => {
    await crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)});
    const tokenSold = 10000;
    const tokenDistribution = await crowdsaleEscrow.tokenDistribution();
    await crowdsaleEscrow.finalize(tokenSold);
    
    const TokenDistributionInstance = await TokenDistribution.at(tokenDistribution);
    const tokenDistributionOwner = await TokenDistributionInstance.owner();
    
    expect(tokenDistributionOwner).to.equal(getDefaultAddress(accounts));
  })

  it('should emit LogComplete event', async () => {
    const tokenSold = 10000;
    const {receipt: {logs}} = await crowdsaleEscrow.finalize(tokenSold);
    const logContent = findEvent(logs, 'LogComplete');

    expect(logContent).to.not.equal(undefined);
  })

  it('should revert if invoked only by a non-owner of the contract', async () => {
    await crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)});
    const tokenSold = 10000;

    await expectVMException(
      crowdsaleEscrow.finalize(tokenSold, {from: getContributor(accounts, 1)})
    );
 })

  it('should revert if the given token amount if greater than the total available tokens for sale', async () => {
    const manyTokens = million(tokenAvailableForSaleInMillions + 1);
    
    await expectVMException(
      crowdsaleEscrow.finalize(manyTokens)
    );
  })

  it('should revert if it is already finalized', async () => {
    await crowdsaleEscrow.finalize(10000);

    await expectVMException(
      crowdsaleEscrow.finalize(10000)
    );
  })
})
