const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {deployMockContract} = require('../../helpers/deploy');
const {ZERO_ADDRESS} = require('../../../../common/test/helpers/address');
const {
  deployTclRepository,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  checkpointCodes
} = require('../utils');

contract('TclRepository: addCheckpoints', accounts => {
  let tclRepository;
  let mockSuccess;
  let mockFailure;
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

  it('should successfully add new checkpoints', async () => {
    await tclRepository.addCheckpoints(
      erc20.address,
      [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockFailureCheckpoint],
      [mockSuccess.address, mockFailure.address],
      {from: mainController}
    );

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint2 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint);

    expect(checkpoint1).to.equal(mockSuccess.address);
    expect(checkpoint2).to.equal(mockFailure.address);
  });

  it('should add new checkpoints for multiple token addresses', async () => {
    const secondToken = await deployMockContract();
    const thirdToken = await deployMockContract();

    await tclRepository.addCheckpoints(
      erc20.address,
      [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockFailureCheckpoint],
      [mockSuccess.address, mockFailure.address],
      {from: mainController}
    );

    await tclRepository.addCheckpoints(
      secondToken.address,
      [checkpointCodes.mockSuccessCheckpoint],
      [mockSuccess.address],
      {from: mainController}
    );

    await tclRepository.addCheckpoints(
      thirdToken.address,
      [checkpointCodes.mockFailureCheckpoint],
      [mockFailure.address],
      {from: mainController}
    );

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint2 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint);

    expect(checkpoint1).to.equal(mockSuccess.address);
    expect(checkpoint2).to.equal(mockFailure.address);

    const checkpoint3 = await tclRepository.getCheckpoint(secondToken.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint4 = await tclRepository.getCheckpoint(secondToken.address, checkpointCodes.mockFailureCheckpoint);
    expect(checkpoint3).to.equal(mockSuccess.address);
    expect(checkpoint4).to.equal(ZERO_ADDRESS);

    const checkpoint5 = await tclRepository.getCheckpoint(thirdToken.address, checkpointCodes.mockFailureCheckpoint);
    const checkpoint6 = await tclRepository.getCheckpoint(thirdToken.address, checkpointCodes.mockSuccessCheckpoint);
    expect(checkpoint5).to.equal(mockFailure.address);
    expect(checkpoint6).to.equal(ZERO_ADDRESS);
  });

  it('should revert if arrays have different length', async () => {
    await shouldFailWithMessage(
      tclRepository.addCheckpoints(
        erc20.address,
        [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockFailureCheckpoint],
        [mockSuccess.address, mockFailure.address, mockFailure.address],
        {from: mainController}
      ),
      'Array length mismatch'
    );
  });
});
