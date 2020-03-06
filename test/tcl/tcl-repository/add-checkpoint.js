const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {deployMockContract} = require('../../helpers/deploy');
const {
  deployTclRepository,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  checkpointCodes
} = require('../utils');
const {findEvent} = require('../../helpers/events');

contract('TclRepository: addCheckpoint', accounts => {
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
  })

  it('should successfully add a new checkpoint', async () => {
    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockSuccessCheckpoint, 
      mockSuccess.address, 
      {from: mainController}
    );

    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockFailureCheckpoint, 
      mockFailure.address, 
      {from: mainController}
    );

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint2 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint);

    expect(checkpoint1).to.equal(mockSuccess.address);
    expect(checkpoint2).to.equal(mockFailure.address);
  })

  it('should emit CheckpointAdded event', async () => {
    const {receipt: {logs}} =  await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockSuccessCheckpoint, 
      mockSuccess.address, 
      {from: mainController}
    );

    const {args} = findEvent(logs, 'CheckpointAdded');

    expect(args.token).to.equal(erc20.address);
    expect(args.checkpointCode.toNumber()).to.equal(checkpointCodes.mockSuccessCheckpoint);
    expect(args.transferCheckpoint).to.equal(mockSuccess.address);
  })

  it('should add new checkpoints for multiple token addresses', async () => {
    const secondToken = await deployMockContract();
    const thirdToken = await deployMockContract();

    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockSuccessCheckpoint,
      mockSuccess.address,
      {from: mainController}
    );

    await tclRepository.addCheckpoint(
      secondToken.address,
      checkpointCodes.mockSuccessCheckpoint,
      mockSuccess.address,
      {from: mainController}
    );

    await tclRepository.addCheckpoint(
      thirdToken.address,
      checkpointCodes.mockFailureCheckpoint,
      mockFailure.address,
      {from: mainController}
    );

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    expect(checkpoint1).to.equal(mockSuccess.address);

    const checkpoint2 = await tclRepository.getCheckpoint(secondToken.address, checkpointCodes.mockSuccessCheckpoint);
    expect(checkpoint2).to.equal(mockSuccess.address);

    const checkpoint3 = await tclRepository.getCheckpoint(thirdToken.address, checkpointCodes.mockFailureCheckpoint);
    expect(checkpoint3).to.equal(mockFailure.address);
  });

  it('should revert if not called by a controller', async () => {
    await shouldFailWithMessage(
      tclRepository.addCheckpoint(
        erc20.address,
        checkpointCodes.mockSuccessCheckpoint, 
        mockSuccess.address, 
        {from: accounts[5]}
      ),
      'Only controller role'
    )
  })

  it('should revert if the given transfer checkpoint is not a contract address', async () => {
    await shouldFailWithMessage(
      tclRepository.addCheckpoint(
        erc20.address,
        checkpointCodes.mockSuccessCheckpoint, 
        accounts[5],
        {from: mainController}
      ),
      'Transfer Checkpoint must be a conrtact address'
    )
  })
})
