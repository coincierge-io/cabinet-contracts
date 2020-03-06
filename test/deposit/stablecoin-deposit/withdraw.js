const {expect, expectBignumberEqual} = require('../../../../common/test/helpers');
const {deployDeposit} = require('./common');
const {Currencies} = require('../../helpers/deploy');
const {getContributor, getDefaultAddress} = require('../../../../common/test/helpers/address');
const {getTokens, shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {findEvent} = require('../../helpers/events');

contract('StablecoinDeposit: withdraw', accounts => {
  let stablecoinDeposit;
  let trueUsdToken;

  const approve = async () => {
    await trueUsdToken.approve(
      stablecoinDeposit.address,
      getTokens(100),
      {from: getContributor(accounts, 1)}
    );

    await stablecoinDeposit.confirmDeposit(
      getContributor(accounts, 1),
      getTokens(100),
      Currencies.TRUE_USD
    );
  };

  beforeEach(async () => {
    [stablecoinDeposit, _, trueUsdToken] = await deployDeposit(accounts);
  });

  it('should set the total deposit amount for the given beneficiary to 0', async () => {
    await approve();
    await stablecoinDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});
    await stablecoinDeposit.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });

    const personalBalance = await stablecoinDeposit.getDeposit(
      getContributor(accounts, 1),
      Currencies.TRUE_USD
    );

    expect(personalBalance.toNumber()).to.equal(0);
  });

  it('should transfer the total deposit amount to the given beneficiary', async () => {
    await approve();
    const tokenBalanceBefore = await trueUsdToken.balanceOf(getContributor(accounts, 1));
    await stablecoinDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});
    await stablecoinDeposit.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });

    const tokenBalance = await trueUsdToken.balanceOf(getContributor(accounts, 1));
    expectBignumberEqual(tokenBalance, getTokens(100).add(tokenBalanceBefore));
  });

  it('should emit Withdraw event', async () => {
    await approve();
    await stablecoinDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});
    const {receipt: {logs}} = await stablecoinDeposit.withdraw(Currencies.TRUE_USD, {
      from: getContributor(accounts, 1)
    });

    const {args} = findEvent(logs, 'Withdraw');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expectBignumberEqual(args.value, getTokens(100));
    expect(args.currency).to.equal(Currencies.TRUE_USD);
  });

  it('should revert if the given currency is not present in the token repository', async () => {
    await approve();
    await stablecoinDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});

    await shouldFailWithMessage(
      stablecoinDeposit.withdraw('UNKNOWN_TOKEN', {
        from: getContributor(accounts, 1)
      }),
      'Cannot find the given token'
    );
  });

  it('should revert if the refund is not enabled', async () => {
    await approve();

    await shouldFailWithMessage(
      stablecoinDeposit.withdraw(Currencies.TRUE_USD, {
        from: getContributor(accounts, 1)
      }),
      'Refund is not enabled'
    );
  });
});
