const {expect} = require('../../../../common/test/helpers');
const {deployMockContract} = require('../../helpers/deploy');
const {
  deployTclRepository,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  checkpointCodes
} = require('../utils');
const {ZERO_ADDRESS} = require('../../../../common/test/helpers/address');

contract('TclRepository: removeCheckpoints', accounts => {
  let tclRepository;
  const mainController = accounts[1];
  let erc20;

  beforeEach(async () => {
    mockSuccess = await deployMockSuccessCheckpoint(accounts);
    mockFailure = await deployMockFailureCheckpoint(accounts);
    erc20 = await deployMockContract();

    tclRepository = await deployTclRepository(
      accounts,
      {account: mainController}
    );
  });

  it('should remove the given list of checkpoints', async () => {
    await tclRepository.removeCheckpoints(
      erc20.address,
      [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockFailureCheckpoint],
      {from: mainController}
    );

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint2 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint);

    expect(checkpoint1).to.equal(ZERO_ADDRESS);
    expect(checkpoint2).to.equal(ZERO_ADDRESS);
  });
});
