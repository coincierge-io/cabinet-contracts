const {expect} = require('../../helpers/')
const {deployEthEscrow} = require('../../helpers/deploy')
const {getContributor, getWalletAddress} = require('../../helpers/address')
const {toWei, balanceDeltaAfterAction, moveToOpeningTime} = require('../../helpers/utils')
const {findEvent} = require('../../helpers/events')

contract('EthEscrow: terminate', accounts => {
  let ethEscrow;

  beforeEach(async () => {
    ethEscrow = await deployEthEscrow(accounts);
    await moveToOpeningTime(ethEscrow);
  })

  it('should transfer the funds to the given wallet address', async () => {
    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    await ethEscrow.sendTransaction({
      value: toWei(1, 'ether'),
      from: getContributor(accounts, 1)
    });

    const walletBalanceDelta = await balanceDeltaAfterAction(
      getWalletAddress(accounts), 
      () => ethEscrow.terminate(),
      false
    );

    expect(walletBalanceDelta.toString()).to.equal(toWei(2, 'ether'));
  })
  
  it('should emit Terminate event', async () => {
    const {receipt: {logs}} = await ethEscrow.terminate();
    const {event} = findEvent(logs, 'Terminate');

    expect(event).to.equal('Terminate');
  })
})
