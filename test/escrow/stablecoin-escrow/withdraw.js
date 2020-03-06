const {expect, expectBignumberEqual} = require('../../helpers/')
const {deployEscrow} = require('./common')
const {Currencies} = require('../../helpers/deploy')
const {getContributor, getDefaultAddress} = require('../../helpers/address')
const {getTokens, shouldFailWithMessage, moveToOpeningTime} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('StablecoinEscrow: withdraw', accounts => {
  let stablecoinEscrow;
  let trueUsdToken;

  const approve = async () => {
    await trueUsdToken.approve(
      stablecoinEscrow.address, 
      getTokens(100),
      {from: getContributor(accounts, 1)}
    );

    await stablecoinEscrow.confirmContribution(
      getContributor(accounts, 1), 
      getTokens(100), 
      Currencies.TRUE_USD
    )
  }

  beforeEach(async () => {
    [stablecoinEscrow, _, trueUsdToken] = await deployEscrow(accounts);
    await moveToOpeningTime(stablecoinEscrow);
  })

  it('should set the total contribution amount for the given beneficiary to 0', async () => {
    await approve();
    await stablecoinEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    await stablecoinEscrow.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });
    
    const personalBalance = await stablecoinEscrow.getContribution(
      getContributor(accounts, 1), 
      Currencies.TRUE_USD
    );

    expect(personalBalance.toNumber()).to.equal(0);
  })

  it('should transfer the total contribution amount to the given beneficiary', async () => {
    await approve();
    const tokenBalanceBefore = await trueUsdToken.balanceOf(getContributor(accounts, 1));
    await stablecoinEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    await stablecoinEscrow.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });

    const tokenBalance = await trueUsdToken.balanceOf(getContributor(accounts, 1));
    expectBignumberEqual(tokenBalance, getTokens(100).add(tokenBalanceBefore));
  })

  it('should emit Withdraw event', async () => {
    await approve();
    await stablecoinEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    const {receipt: {logs}} = await stablecoinEscrow.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });
    
    const {args} = findEvent(logs, 'Withdraw');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expectBignumberEqual(args.value, getTokens(100));
    expect(args.currency).to.equal(Currencies.TRUE_USD);
  })

  it('should revert if the given currency is not present in the token repository', async () => {
    await approve();
    await stablecoinEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});

    await shouldFailWithMessage(
      stablecoinEscrow.withdraw('UNKNOWN_TOKEN', {
        from: getContributor(accounts, 1)
      }),  
      'Cannot find the given token'
    )
  })

  it('should revert if the refund is not enabled', async () => {
    await approve();

    await shouldFailWithMessage(
      stablecoinEscrow.withdraw(Currencies.TRUE_USD, {
        from: getContributor(accounts, 1)
      }),
      'Refund is not enabled'
    );
  })
})
