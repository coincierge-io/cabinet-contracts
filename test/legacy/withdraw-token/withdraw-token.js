const {expect, expectBignumberEqual} = require('../../../../common/test/helpers')
const {getContributor, getTeamFundAddress, getBountyAddress} = require('../../../../common/test/helpers/address')
const {deploy} = require('../../helpers/deploy')
const {expectVMException, toWei, getTokens} = require('../../../../common/test/helpers/utils')
const {increaseTimeTo} = require('../../../../common/test/helpers/timeUtils')

contract('withdraw tokens', accounts => {
  const teamFundAddress = getTeamFundAddress(accounts);
  const bountyAddress = getBountyAddress(accounts);

  let crowdsale;
  let tokenInstance;
  
  const moveToClosingTime = async () => {
    const closingTime = await crowdsale.closingTime();
    await increaseTimeTo(closingTime.toNumber() + 1); 
  }

  beforeEach(async () => {
    const contracts = await deploy(accounts);
    [crowdsale, tokenInstance] = contracts;
  })

  it('should revert if users try to withdraw tokens before the closing time of the ICO', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, true); 

    await expectVMException(
      crowdsale.withdrawTokens({from: getContributor(accounts, 1)})
    )

    await expectVMException(
      crowdsale.withdrawTokens({from: getContributor(accounts, 2)})
    )
  }) 

  it('should not send any tokens upon unsuccessful ICO', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, false); 
    await moveToClosingTime();

    const contrib1TokenBalance = await tokenInstance.balanceOf(getContributor(accounts, 1));
    const contrib2TokenBalance = await tokenInstance.balanceOf(getContributor(accounts, 2));
    
    expect(contrib1TokenBalance.toNumber()).to.equal(0);
    expect(contrib2TokenBalance.toNumber()).to.equal(0);
  })

  it('should send tokens to contributors upon successful ICO', async () => {
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(1, 'ether')});
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, true); 
    await moveToClosingTime();

    await crowdsale.withdrawTokens({from: getContributor(accounts, 1)});
    await crowdsale.withdrawTokens({from: getContributor(accounts, 2)});
    
    const contrib1TokenBalance = await tokenInstance.balanceOf(getContributor(accounts, 1));
    const contrib2TokenBalance = await tokenInstance.balanceOf(getContributor(accounts, 2));
    
    expectBignumberEqual(contrib1TokenBalance, getTokens(5000));
    expectBignumberEqual(contrib2TokenBalance, getTokens(10000));
  })

  it('should handle dynamic rates', async () => {
    const contracts = await deploy(accounts, toWei(2, 'ether'));
    [crowdsale, tokenInstance] = contracts;
    await crowdsale.sendTransaction({from: getContributor(accounts, 1), value: toWei(2, 'ether')});
    await crowdsale.setCurrentRate(7500);
    await crowdsale.sendTransaction({from: getContributor(accounts, 2), value: toWei(2, 'ether')});
    await crowdsale.complete(teamFundAddress, bountyAddress, true); 
    await moveToClosingTime();
    await crowdsale.withdrawTokens({from: getContributor(accounts, 1)});
    await crowdsale.withdrawTokens({from: getContributor(accounts, 2)});

    const contributor1Tokens = await tokenInstance.balanceOf(getContributor(accounts, 1));
    const contributor2Tokens = await tokenInstance.balanceOf(getContributor(accounts, 2));

    expectBignumberEqual(contributor1Tokens, getTokens(10000));
    expectBignumberEqual(contributor2Tokens, getTokens(15000));
  })
});
