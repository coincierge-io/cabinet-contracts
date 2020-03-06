const {expect} = require('../../helpers');
const {deployEthDeposit, Currencies} = require('../../helpers/deploy');
const {getContributor, getDefaultAddress} = require('../../helpers/address');
const {
  toWei, shouldFailWithMessage, balanceDeltaAfterAction
} = require('../../helpers/utils');
const {findEvent} = require('../../helpers/events');

contract('EthDeposit: withdraw', accounts => {
  let ethDeposit;
  const mainController = accounts[0];

  beforeEach(async () => {
    ethDeposit = await deployEthDeposit(
      accounts,
      {account: mainController}
    );
  });

  it('should set the total deposit amount for the given beneficiary to 0', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});
    await ethDeposit.withdraw(Currencies.ETH, {
      from: getContributor(accounts, 1)
    });

    const personalBalance = await ethDeposit.getDeposit(getContributor(accounts, 1), Currencies.ETH);
    expect(personalBalance.toString()).to.equal(toWei(0, 'ether'));
  });

  it('should transfer the total deposit amount to the given beneficiary', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});

    const balanceDelta = await balanceDeltaAfterAction(
      getContributor(accounts, 1),
      () => ethDeposit.withdraw(Currencies.ETH, {
        from: getContributor(accounts, 1)
      })
    );

    expect(balanceDelta.toString()).to.equal(toWei(1, 'ether'));
  });

  it('should emit Withdraw event', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethDeposit.changeWithdrawState(true, {from: getDefaultAddress(accounts)});
    const {receipt: {logs}} = await ethDeposit.withdraw(Currencies.ETH, {
      from: getContributor(accounts, 1)
    });

    const {args} = findEvent(logs, 'Withdraw');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expect(args.value.toString()).to.equal(toWei(1, 'ether'));
    expect(args.currency).to.equal(Currencies.ETH);
  });

  it('should revert if the withdraw is not enabled', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await shouldFailWithMessage(
      ethDeposit.withdraw(Currencies.ETH, {from: getContributor(accounts, 1)}),
      'Refund is not enabled'
    );
  });
});
