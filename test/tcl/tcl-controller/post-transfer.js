const {expectBignumberEqual} = require('../../../../common/test/helpers')
const {deployMockContract} = require('../../helpers/deploy')
const {
  getTokens,
  toHex,
  hexToBytes,
  shouldFailWithMessage
} = require('../../../../common/test/helpers/utils')
const {
  deployTclRepository,
  deployTclController,
  deployMockSuccessCheckpoint,
  deployMockPostTransferCheckpoint,
  getExecutionPlanWithIPostTransfer,
  operators,
  checkpointCodes
} = require('../utils')

contract('TclController: postTransfer', accounts => {
  let tclRepository
  let tclController
  let mockPostTransfer
  let mockPostTransfer2
  let erc20
  let secondToken

  const mainController = accounts[1]
  const sender = accounts[2]
  const recipient = accounts[3]

  beforeEach(async () => {
    tclRepository = await deployTclRepository(accounts, {
      account: mainController
    });

    const params = {
      tclRepository: tclRepository.address,
      account: mainController
    }

    tclController = await deployTclController(accounts, params);
    const mockSuccess = await deployMockSuccessCheckpoint(accounts);
    mockPostTransfer = await deployMockPostTransferCheckpoint(accounts, {
      account: tclController.address
    });
    
    mockPostTransfer2 = await deployMockPostTransferCheckpoint(accounts, {
      account: tclController.address
    });
    
    erc20 = await deployMockContract()
    secondToken = await deployMockContract()

    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockSuccessCheckpoint,
      mockSuccess.address,
      {from: mainController}
    )

    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockPostTransfer,
      mockPostTransfer.address,
      {from: mainController}
    )

    await tclRepository.addCheckpoint(
      erc20.address,
      checkpointCodes.mockPostTransfer2,
      mockPostTransfer2.address,
      {from: mainController}
    )
  });

  it('should call all the post transfer based on the current execution plan', async () => {
    await tclController.updateExecutionPlan(
      erc20.address,
      getExecutionPlanWithIPostTransfer(),
      {from: mainController}
    );

    await tclController.postTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address,
      {from: mainController}
    );

    const mockPostTransferCounter = await mockPostTransfer.counter.call();
    const mockPostTransferCounter2 = await mockPostTransfer.counter.call();

    expectBignumberEqual(mockPostTransferCounter, 1);
    expectBignumberEqual(mockPostTransferCounter2, 1);
  });

  it('should handle multiple token addresses', async () => {
    await tclController.updateExecutionPlan(
      erc20.address,
      getExecutionPlanWithIPostTransfer(),
      {from: mainController}
    );

    await tclController.postTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address,
      {from: mainController}
    );

    const mockPostTransferCounter = await mockPostTransfer.counter.call();
    const mockPostTransferCounter2 = await mockPostTransfer.counter.call();

    expectBignumberEqual(mockPostTransferCounter, 1);
    expectBignumberEqual(mockPostTransferCounter2, 1);

    // setup post transfer checkpoints for the second token
    mockPostTransfer = await deployMockPostTransferCheckpoint(accounts, {
      account: tclController.address
    });
    
    await tclRepository.addCheckpoint(
      secondToken.address,
      checkpointCodes.mockPostTransfer,
      mockPostTransfer.address,
      {from: mainController}
    );
    
    await tclController.updateExecutionPlan(
      secondToken.address,
      // keep just one post transfer in the execution plan
      [
        checkpointCodes.mockPostTransfer,
        checkpointCodes.mockPostTransfer,
        operators.and
      ],
      {from: mainController}
    );

    await tclController.postTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      secondToken.address,
      {from: mainController}
    );

    const mockPostTransferSecondTokenCounter = await mockPostTransfer.counter.call();
    expectBignumberEqual(mockPostTransferSecondTokenCounter, 2);
  });

  it('should only be called by either the token or an account with the controller role', async () => {
    await shouldFailWithMessage(
      tclController.postTransfer(
        sender,
        recipient,
        getTokens(100),
        hexToBytes(toHex('empty_bytes_data')),
        erc20.address,
        {from: sender}
      ),
      'Only token or controller address'
    );
  });
})
