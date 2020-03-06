const {expect} = require('../../helpers')
const {deployCrowdsaleEscrow} = require('../../helpers/deploy')
const {getContributor, getDefaultAddress} = require('../../helpers/address')
const {
  toWei, 
  expectVMException, 
  balanceDeltaAfterAction, 
  moveToOpeningTime
} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('CrowdsaleEscrow: withdraw', accounts => {
  let crowdsaleEscrow;

  beforeEach(async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
    await moveToOpeningTime(crowdsaleEscrow);
  })

  it('should set the total contribution amount for the given beneficiary to 0', async () => {
    await crowdsaleEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await crowdsaleEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    await crowdsaleEscrow.withdraw({
      from: getContributor(accounts, 1)
    });
    
    const personalBalance = await crowdsaleEscrow.getContribution(getContributor(accounts, 1));

    expect(personalBalance.toString()).to.equal(toWei(0, 'ether'));
  })

  it('should transfer the total contribution amount to the given beneficiary', async () => {
    await crowdsaleEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });
    await crowdsaleEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});

    const balanceDelta = await balanceDeltaAfterAction(
      getContributor(accounts, 1),
      () => crowdsaleEscrow.withdraw({
        from: getContributor(accounts, 1)
      })
    )

    expect(balanceDelta.toString()).to.equal(toWei(1, 'ether'));
  })

  it('should emit LogWithdraw event', async () => {
    await crowdsaleEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });
    
    await crowdsaleEscrow.changeRefundState(true, {from: getDefaultAddress(accounts)});
    const {receipt: {logs}} = await crowdsaleEscrow.withdraw({
      from: getContributor(accounts, 1)
    });
    
    const {args} = findEvent(logs, 'LogWithdraw');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expect(args.value.toString()).to.equal(toWei(1, 'ether'));
  })

  it('should revert if the refund is not enabled', async () => {
    await crowdsaleEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });
    
    await expectVMException(
      crowdsaleEscrow.withdraw({from: getContributor(accounts, 1)})
    );
  })
})
