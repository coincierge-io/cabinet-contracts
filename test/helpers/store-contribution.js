const {expect, expectBignumberEqual} = require('../../helpers');
const {getNonWhitelistedAdress} = require('../../helpers/address');
const {getContributor} = require('../../helpers/address');
const {findEvent} = require('./events');
const {
  toWei,
  getBlock,
  expectVMException,
  shouldFailWithMessage,
  moveToOpeningTime,
  moveToClosingTime
} = require('../../helpers/utils');

const commonTests = (
  accounts,
  deployEscrow,
  confirmContribution,
  currency,
  amount
) => {
  let escrow;

  it('should revert if contributions happens before the opening date', async () => {
    escrow = await deployEscrow(accounts);

    await shouldFailWithMessage(
      confirmContribution(escrow, getContributor(accounts, 1)),
      'Time restrictions not met'
    );
  });

  describe('When open', () => {
    beforeEach(async () => {
      escrow = await deployEscrow(accounts);
      await moveToOpeningTime(escrow);
    });

    it('should update the totalRaised', async () => {
      await confirmContribution(escrow, getContributor(accounts, 1));

      const totalRaised = await escrow.getTotalRaised(currency);

      expect(totalRaised.toString()).to.equal(amount);
    });

    it('should update the total contribution amount for a given beneficiary', async () => {
      await confirmContribution(escrow, getContributor(accounts, 1));

      const personalBalance = await escrow.getContribution(getContributor(accounts, 1), currency);

      expect(personalBalance.toString()).to.equal(amount);
    });

    it('should update the total contribution amount for a given beneficiary after multiple contributions', async () => {
      await confirmContribution(escrow, getContributor(accounts, 1));
      await confirmContribution(escrow, getContributor(accounts, 1));

      const personalBalance = await escrow.getContribution(getContributor(accounts, 1), currency);

      expect(personalBalance.toString()).to.equal(`${amount * 2}`);
    });

    it('should log Contribution', async () => {
      const {receipt: {logs, blockNumber}} = await confirmContribution(escrow, getContributor(accounts, 1));
      const {args} = findEvent(logs, 'Contribution');
      const {timestamp} = await getBlock(blockNumber);

      expect(args.beneficiary).to.equal(getContributor(accounts, 1));
      expectBignumberEqual(args.value, amount);
      expect(args.currency).to.equal(currency);
      expectBignumberEqual(args.time, timestamp);
    });

    it('should revert if contract in paused state', async () => {
      await escrow.pause();

      await expectVMException(
        confirmContribution(escrow, getContributor(accounts, 1))
      );
    });

    it('should revert if contribution amount is 0', async () => {
      await expectVMException(
        confirmContribution(escrow, getContributor(accounts, 1), toWei(0, 'ether')),
        'Contribution amount should be greater than 0'
      );
    });

    it('should revert if the escrow is closed', async () => {
      await escrow.terminate();

      await expectVMException(
        confirmContribution(escrow, getContributor(accounts, 1)),
        'The escrow is finalized'
      );
    });

    it('should revert if refund enabled', async () => {
      await escrow.changeRefundState(true);

      await expectVMException(
        confirmContribution(escrow, getContributor(accounts, 1)),
        'Refund is enabled'
      );
    });
  });

  it('should revert if contributions happens after the closing date', async () => {
    escrow = await deployEscrow(accounts);
    await moveToClosingTime(escrow);

    await shouldFailWithMessage(
      confirmContribution(escrow, getContributor(accounts, 1)),
      'Time restrictions not met'
    );
  });
};

module.exports = {commonTests};
