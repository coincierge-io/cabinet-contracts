const {expect} = require('../../helpers/')
const {deployBasicEscrow} = require('../../helpers/deploy')
const {getContributor} = require('../../helpers/address')
const {expectVMException} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('BasicEscrow: terminate', accounts => {
  let basicEscrow;

  beforeEach(async () => {
    basicEscrow = await deployBasicEscrow(accounts);
  })

  it('should change isTerminated to true', async () => {
    await basicEscrow.terminate();

    const isTerminated = await basicEscrow.isTerminated();

    expect(isTerminated).to.equal(true);
  })
  
  it('should be invoked only by the owner of the contract', async () => {
    await expectVMException(
      basicEscrow.terminate({from: getContributor(accounts, 1)})
    );
  })

  it('should emit Terminate event', async () => {
    const {receipt: {logs}} = await basicEscrow.terminate();
    const {event} = findEvent(logs, 'Terminate');

    expect(event).to.be.equal('Terminate');
  })
})
