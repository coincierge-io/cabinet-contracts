const {expect} = require('../../../../common/test/helpers');
const {deployBasicDeposit} = require('../../helpers/deploy');
const {expectVMException} = require('../../../../common/test/helpers/utils');
const {getContributor} = require('../../../../common/test/helpers/address');

contract('BasicDeposit: changeWithdrawState', accounts => {
  let basicDeposit;

  beforeEach(async () => {
    basicDeposit = await deployBasicDeposit(accounts);
  });

  it('should be invoked only by the owner of the contract', async () => {
    await expectVMException(
      basicDeposit.changeWithdrawState(true, {from: getContributor(accounts, 1)})
    );
  });

  it('should change isWithdrawEnabled to true if the given parameter is true', async () => {
    await basicDeposit.changeWithdrawState(true);
    const isWithdrawEnabled = await basicDeposit.isWithdrawEnabled();

    expect(isWithdrawEnabled).to.equal(true);
  });

  it('should change isWithdrawEnabled to false if the given parameter is false', async () => {
    await basicDeposit.changeWithdrawState(true);
    await basicDeposit.changeWithdrawState(false);
    const isWithdrawEnabled = await basicDeposit.isWithdrawEnabled();

    expect(isWithdrawEnabled).to.equal(false);
  });
});
