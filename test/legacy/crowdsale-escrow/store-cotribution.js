const {expect, expectBignumberEqual} = require('../../helpers')
const {deployCrowdsaleEscrow} = require('../../helpers/deploy')
const {getContributor} = require('../../helpers/address')
const {
  toWei, 
  getBlock, 
  expectVMException, 
  moveToOpeningTime, 
  moveToClosingTime
} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('CrowdsaleEscrow: storeContibution', accounts => {
  let crowdsaleEscrow;

  it('should revert if contributions happens before the opening date', async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);

    await expectVMException(
      crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)})
    );
  })

  describe('When open', () => {
    beforeEach(async () => {
      crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
      await moveToOpeningTime(crowdsaleEscrow);
    })

    it('should update the total weiRaised', async () => {
      await crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)});
      
      const weiRaised = await crowdsaleEscrow.weiRaised();
      
      expect(weiRaised.toString()).to.equal(toWei(1, 'ether'));
    })
  
    it('should update the total contribution wei amount for a given beneficiary', async () => {
      await crowdsaleEscrow.sendTransaction({
        value: toWei(1, 'ether'),
        from: getContributor(accounts, 1)
      });
  
      const personalBalance = await crowdsaleEscrow.getContribution(getContributor(accounts, 1));
  
      expect(personalBalance.toString()).to.equal(toWei(1, 'ether'));
    })
  
    it('should update the total contribution wei amount for a given beneficiary after multiple contributions', async () => {
      await crowdsaleEscrow.sendTransaction({
        value: toWei(1, 'ether'),
        from: getContributor(accounts, 1)
      });
  
      await crowdsaleEscrow.sendTransaction({
        value: toWei(1, 'ether'),
        from: getContributor(accounts, 1)
      });
  
      const personalBalance = await crowdsaleEscrow.getContribution(getContributor(accounts, 1));
  
      expect(personalBalance.toString()).to.equal(toWei(2, 'ether'));
    })
  
    it('should log LogContribution', async () => {
      const {receipt: {logs, blockNumber}} = await crowdsaleEscrow.sendTransaction({
        value: toWei(1, 'ether'), 
        from: getContributor(accounts, 1)
      });

      const {args} = findEvent(logs, 'LogContribution');
      const {timestamp} = await getBlock(blockNumber)

      expect(args.beneficiary).to.equal(getContributor(accounts, 1));
      expectBignumberEqual(args.value, toWei(1, 'ether'));
      expectBignumberEqual(args.time, timestamp);
    })

    it('should revert if address is not whitelisted', async () => {
      const nonWhitelistedAddress = getContributor(accounts, 5);

      await expectVMException(
        crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: nonWhitelistedAddress})
      );
    })
  
    it('should revert if contract in paused state', async () => {
      await crowdsaleEscrow.pause();
  
      await expectVMException(
        crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)})
      );
    })
  
    it('should revert if weiAmount sent is 0', async () => {
       await expectVMException(
        crowdsaleEscrow.sendTransaction({value: toWei(0, 'ether'), from: getContributor(accounts, 1)})
      );
    })
  
    it('should revert if finalized', async () => {
      await crowdsaleEscrow.finalize(1000);
  
      await expectVMException(
        crowdsaleEscrow.sendTransaction({value: toWei(0, 'ether'), from: getContributor(accounts, 1)})
      );
    })

    it('should revert if refund enabled', async () => {
      await crowdsaleEscrow.changeRefundState(true);
  
      await expectVMException(
        crowdsaleEscrow.sendTransaction({value: toWei(0, 'ether'), from: getContributor(accounts, 1)})
      );
    })
  })

  it('should revert if contributions happens after the closing date', async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
    await moveToClosingTime(crowdsaleEscrow);
    
    await expectVMException(
      crowdsaleEscrow.sendTransaction({value: toWei(1, 'ether'), from: getContributor(accounts, 1)})
    );
  })
})
