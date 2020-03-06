const {expect} = require('../../helpers/')
const {deployEthEscrow, Currencies} = require('../../helpers/deploy')
const {getContributor, getDefaultAddress} = require('../../helpers/address')
const {
  toWei, 
  shouldFailWithMessage, 
  balanceDeltaAfterAction, 
  moveToOpeningTime
} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('EthEscrow: withdraw', accounts => {
  let ethEscrow;

  beforeEach(async () => {
    ethEscrow = await deployEthEscrow(accounts);
    await moveToOpeningTime(ethEscrow);
  })

  it('should set the total contribution amount for the given beneficiary to 0', async () => {
    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    await ethEscrow.withdraw(Currencies.ETH, {
      from: getContributor(accounts, 1)
    });
    
    const personalBalance = await ethEscrow.getContribution(getContributor(accounts, 1), Currencies.ETH);
    expect(personalBalance.toString()).to.equal(toWei(0, 'ether'));
  })

  it('should transfer the total contribution amount to the given beneficiary', async () => {
    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});

    const balanceDelta = await balanceDeltaAfterAction(
      getContributor(accounts, 1),
      () => ethEscrow.withdraw(Currencies.ETH, {
        from: getContributor(accounts, 1)
      })
    )

    expect(balanceDelta.toString()).to.equal(toWei(1, 'ether'));
  })

  it('should emit Withdraw event', async () => {
    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });
    
    await ethEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    const {receipt: {logs}} = await ethEscrow.withdraw(Currencies.ETH, {
      from: getContributor(accounts, 1)
    });
    
    const {args} = findEvent(logs, 'Withdraw');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expect(args.value.toString()).to.equal(toWei(1, 'ether'));
    expect(args.currency).to.equal(Currencies.ETH);
  })

  it('should revert if the refund is not enabled', async () => {
    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });
    
    await shouldFailWithMessage(
      ethEscrow.withdraw(Currencies.ETH, {from: getContributor(accounts, 1)}),
      'Refund is not enabled'
    );
  })
})
