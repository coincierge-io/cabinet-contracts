const {expect} = require('../../../../common/test/helpers')
const {deployCrowdsaleEscrow} = require('../../helpers/deploy')
const {expectVMException} = require('../../../../common/test/helpers/utils')
const {getContributor} = require('../../../../common/test/helpers/address')

contract('CrowdsaleEscrow: changeRefundState', accounts => {
  let crowdsaleEscrow;

  beforeEach(async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
  })

  it('should be invoked only by the owner of the contract', async () => {
     await expectVMException(
       crowdsaleEscrow.changeRefundState(true, {from: getContributor(accounts, 1)})
     );
  })
  
  it('should change isRefundEnabled to true if the given parameter is true', async () => {
    await crowdsaleEscrow.changeRefundState(true);
    const isRefundEnabled = await crowdsaleEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(true);
  })

  it('should change isRefundEnabled to false if the given parameter is false', async () => {
    await crowdsaleEscrow.changeRefundState(true);
    await crowdsaleEscrow.changeRefundState(false);
    const isRefundEnabled = await crowdsaleEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(false);
  })
})
