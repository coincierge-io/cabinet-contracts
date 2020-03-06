const {expect} = require('../../helpers')
const {deployBasicEscrow} = require('../../helpers/deploy')
const {expectVMException} = require('../../helpers/utils')
const {getContributor} = require('../../helpers/address')

contract('BasicEscrow: changeRefundState', accounts => {
  let basicEscrow;

  beforeEach(async () => {
    basicEscrow = await deployBasicEscrow(accounts);
  })

  it('should be invoked only by the owner of the contract', async () => {
     await expectVMException(
       basicEscrow.changeRefundState(true, {from: getContributor(accounts, 1)})
     );
  })
  
  it('should change isRefundEnabled to true if the given parameter is true', async () => {
    await basicEscrow.changeRefundState(true);
    const isRefundEnabled = await basicEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(true);
  })

  it('should change isRefundEnabled to false if the given parameter is false', async () => {
    await basicEscrow.changeRefundState(true);
    await basicEscrow.changeRefundState(false);
    const isRefundEnabled = await basicEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(false);
  })
})
