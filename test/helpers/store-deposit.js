const {expect, expectBignumberEqual} = require('../../../common/test/helpers');
const {getNonWhitelistedAdress} = require('../../../common/test/helpers/address');
const {getContributor} = require('../../../common/test/helpers/address');
const {findEvent} = require('./events');
const {
  toWei,
  getBlock,
  expectVMException
} = require('../../../common/test/helpers/utils');

const commonTests = (
  accounts,
  deployDeposit,
  confirmDeposit,
  currency,
  amount
) => {
  describe('Store deposit', () => {
    let deposit;

    beforeEach(async () => {
      deposit = await deployDeposit(accounts);
    });

    it('should update the Deposited', async () => {
      await confirmDeposit(deposit, getContributor(accounts, 1));

      const totalRaised = await deposit.getTotalRaised(currency);

      expect(totalRaised.toString()).to.equal(amount);
    });

    it('should update the total deposited amount for a given beneficiary', async () => {
      await confirmDeposit(deposit, getContributor(accounts, 1));

      const personalBalance = await deposit.getDeposit(getContributor(accounts, 1), currency);

      expect(personalBalance.toString()).to.equal(amount);
    });

    it('should update the total deposited amount for a given beneficiary after multiple deposits', async () => {
      await confirmDeposit(deposit, getContributor(accounts, 1));
      await confirmDeposit(deposit, getContributor(accounts, 1));

      const personalBalance = await deposit.getDeposit(getContributor(accounts, 1), currency);

      expect(personalBalance.toString()).to.equal(`${amount * 2}`);
    });

    it('should log deposit', async () => {
      const {receipt: {logs, blockNumber}} = await confirmDeposit(deposit, getContributor(accounts, 1));
      const {args} = findEvent(logs, 'Deposit');
      const {timestamp} = await getBlock(blockNumber);

      expect(args.beneficiary).to.equal(getContributor(accounts, 1));
      expectBignumberEqual(args.value, amount);
      expect(args.currency).to.equal(currency);
      expectBignumberEqual(args.time, timestamp);
    });

    it('should revert if deposit amount is 0', async () => {
      await expectVMException(
        confirmDeposit(deposit, getContributor(accounts, 1), toWei(0, 'ether')),
        'Contribution amount should be greater than 0'
      );
    });

    it('should revert if refund enabled', async () => {
      await deposit.changeWithdrawState(true);

      await expectVMException(
        confirmDeposit(deposit, getContributor(accounts, 1)),
        'Refund is enabled'
      );
    });
  });
};

module.exports = {commonTests};
