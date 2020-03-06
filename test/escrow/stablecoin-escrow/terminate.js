const {expect, expectBignumberEqual} = require('../../../../common/test/helpers')
const {deployEscrow} = require('./common')
const {Currencies} = require('../../helpers/deploy')
const {getContributor, getWalletAddress} = require('../../../../common/test/helpers/address')
const {getTokens, moveToOpeningTime, shouldFailWithMessage} = require('../../../../common/test/helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('StablecoinEscrow: terminate', accounts => {
  let stablecoinEscrow;
  let daiToken;
  let trueUsdToken;

  const approve = async () => {
    await daiToken.approve(
      stablecoinEscrow.address, 
      getTokens(200),
      {from: getContributor(accounts, 1)}
    );

    // store two contributions
    await stablecoinEscrow.confirmContribution(
      getContributor(accounts, 1), 
      getTokens(100), 
      Currencies.DAI
    )

    await stablecoinEscrow.confirmContribution(
      getContributor(accounts, 1), 
      getTokens(100), 
      Currencies.DAI
    )
  }

  beforeEach(async () => {
    [stablecoinEscrow, daiToken, trueUsdToken] = await deployEscrow(accounts);
    await moveToOpeningTime(stablecoinEscrow);
  })

  describe('Original version', async () => {
    it('should transfer the funds of all currencies to the given wallet address', async () => {
      await approve();

      await trueUsdToken.approve(
        stablecoinEscrow.address, 
        getTokens(200),
        {from: getContributor(accounts, 1)}
      );
      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100), 
        Currencies.TRUE_USD
      );

      await stablecoinEscrow.terminate();
      const daiBalance = await daiToken.balanceOf(getWalletAddress(accounts));
      const trueUsdBalance = await trueUsdToken.balanceOf(getWalletAddress(accounts));
  
      expectBignumberEqual(daiBalance, getTokens(200));
      expectBignumberEqual(trueUsdBalance, getTokens(100));
    })

    it('should emit Terminate event', async () => {
      const {receipt: {logs}} = await stablecoinEscrow.terminate();
      const {event} = findEvent(logs, 'Terminate');
  
      expect(event).to.equal('Terminate');
    })
  })

  describe('Oveloaded version', async () => {
    it('should transfer the funds to the given wallet address', async () => {
      await approve();
      await stablecoinEscrow.terminate(Currencies.DAI);
      const tokenBalance = await daiToken.balanceOf(getWalletAddress(accounts));
  
      expectBignumberEqual(tokenBalance, getTokens(200));
    })
  
    it('should emit Terminate event', async () => {
      const {receipt: {logs}} = await stablecoinEscrow.terminate(Currencies.DAI);
      const {event} = findEvent(logs, 'Terminate');
  
      expect(event).to.equal('Terminate');
    })

    it('should revert if the given currency is not present in the token repository', async () => {
      await shouldFailWithMessage(
        stablecoinEscrow.terminate('UKNOWN_TOKEN'),  
        'Cannot find the given token'
      )
    })
  })
})
