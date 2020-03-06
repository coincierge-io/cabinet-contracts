const EthEscrow = artifacts.require('EthEscrow')
const StablecoinEscrow = artifacts.require('StablecoinEscrow')
const {expect} = require('../../helpers/')
const {deployEscrowManager} = require('../../helpers/deploy')
const {getContributor} = require('../../helpers/address')
const {moveToClosingTime, shouldFailWithMessage} = require('../../helpers/utils')


contract('EscrowManager: changeRefundState', accounts => {
  let escrowManager;
  let ethEscrow;
  let stablecoinEscrow;

  beforeEach(async () => {
    escrowManager = await deployEscrowManager(accounts);

    const ethEscrowAddress = await escrowManager.ethEscrow();
    ethEscrow = await EthEscrow.at(ethEscrowAddress);

    const stablecoinEscrowAddress = await escrowManager.stablecoinEscrow();
    stablecoinEscrow = await StablecoinEscrow.at(stablecoinEscrowAddress);
  })

  it('should call the ethEscrow changeRefundState function', async () => {
    await escrowManager.changeRefundState(true);

    const isRefundEnabled = await ethEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.be.true;
  })

  it('should call the stablecoinEscrow changeRefundState function', async () => {
    await escrowManager.changeRefundState(true);

    const isRefundEnabled = await stablecoinEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.be.true;
  })

  it('should revert if invoked by non-owner before the closing time', async () => {
    await shouldFailWithMessage(
      escrowManager.changeRefundState(
        true,
        {from: getContributor(accounts, 1)}
      ),
      'Non-owners can invoke after the closing time'
    )
  })

  it('should be called by non-owners if closing time passed expired', async () => {
    await moveToClosingTime(ethEscrow);
    await moveToClosingTime(stablecoinEscrow);
    await escrowManager.changeRefundState(
      true,
      {from: getContributor(accounts, 1)}
    );

    const isRefundEnabled = await ethEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.be.true;
  })
})
