const {expect} = require('../../../../common/test/helpers')
const {getContributor, getTeamFundAddress, getBountyAddress} = require('../../../../common/test/helpers/address')
const {deploy} = require('../../helpers/deploy')
const {expectVMException, toWei, balanceDeltaAfterAction} = require('../../../../common/test/helpers/utils')
const {increaseTimeTo} = require('../../../../common/test/helpers/utils')

contract('refund', accounts => {
  const teamFundAddress = getTeamFundAddress(accounts);
  const bountyAddress = getBountyAddress(accounts);

  let crowdsale;
  
  const moveToClosingTime = async () => {
    const closingTime = await crowdsale.closingTime();
    await increaseTimeTo(closingTime.toNumber() + 1); 
  }

  beforeEach(async () => {
    const contracts = await deploy(accounts);
    [crowdsale] = contracts;
  })

  it('should revert if ico not finalized', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    
    await expectVMException(
      crowdsale.claimRefund({from: getContributor(accounts, 1)})
    )
  })

  it('should revert if goal is reached', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, true); 
    
    await expectVMException(
      crowdsale.claimRefund({from: getContributor(accounts, 1)})
    )
  })

  it('should allow users to get their contibution back is ico is not successful', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, false); 

    const contrib1Refund = await balanceDeltaAfterAction(getContributor(accounts, 1), 
      async () => await crowdsale.claimRefund({from: getContributor(accounts, 1)})
    )

    const contrib2Refund = await balanceDeltaAfterAction(getContributor(accounts, 2), 
      async () => await crowdsale.claimRefund({from: getContributor(accounts, 2)})
    )

    expect(contrib1Refund.toString()).to.equal(toWei(1, 'ether'));
    expect(contrib2Refund.toString()).to.equal(toWei(2, 'ether'))
  })
});
