const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {deployMockContract} = require('../../helpers/deploy');
const {
  deployTclRepository,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  checkpointCodes
} = require('../utils');
const {findEvent} = require('../../helpers/events');
const {ZERO_ADDRESS} = require('../../helpers/address');

contract('TclRepository: removeCheckpoint', accounts => {
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
  })

  it('should remove the given checkpoint', async () => {
    await tclRepository.removeCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint, {from: mainController});
    await tclRepository.removeCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint, {from: mainController});

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    const checkpoint2 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockFailureCheckpoint);

    expect(checkpoint1).to.equal(ZERO_ADDRESS);
    expect(checkpoint2).to.equal(ZERO_ADDRESS);
  });

  it('should remove the checkpoint for the given token but leave the rest intact', async () => {
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
    await tclRepository.removeCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint, {from: mainController});

    const checkpoint1 = await tclRepository.getCheckpoint(erc20.address, checkpointCodes.mockSuccessCheckpoint);
    expect(checkpoint1).to.equal(ZERO_ADDRESS);

    const checkpoint2 = await tclRepository.getCheckpoint(secondToken.address, checkpointCodes.mockSuccessCheckpoint);
    expect(checkpoint2).to.equal(mockSuccess.address);

    const checkpoint3 = await tclRepository.getCheckpoint(thirdToken.address, checkpointCodes.mockFailureCheckpoint);
    expect(checkpoint3).to.equal(mockFailure.address);
  });

  it('should emit CheckpointRemoved event', async () => {
    const {receipt: {logs}} =  await tclRepository.removeCheckpoint(
      erc20.address,
      checkpointCodes.mockSuccessCheckpoint, 
      {from: mainController}
    );

    const {args} = findEvent(logs, 'CheckpointRemoved');

    expect(args.token).to.equal(erc20.address);
    expect(args.checkpointCode.toNumber()).to.equal(checkpointCodes.mockSuccessCheckpoint);
  })

  it('should revert if not called by a controller', async () => {
    await shouldFailWithMessage(
      tclRepository.removeCheckpoint(
        erc20.address,
        checkpointCodes.mockSuccessCheckpoint, 
        {from: accounts[5]}
      ),
      'Only controller role'
    )
  })
})
