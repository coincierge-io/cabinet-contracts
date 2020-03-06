const {expect} = require('../../../../common/test/helpers');
const {getTokens, toHex, hexToBytes, hexToUtf8} = require('../../../../common/test/helpers/utils');
const {deployMockContract} = require('../../helpers/deploy');
const {
  deployTclRepository,
  deployTclController,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  deployMockPostTransferCheckpoint,
  getComplexExecutionPlan,
  ethereumStatusCodes,
  checkpointCodes,
  operators,
  getEmptyExecutionPlan
} = require('../utils');

contract('TclController: canTransfer', accounts => {
  let tclRepository;
  let tclController;
  let mockSuccess;
  let mockFailure;
  let erc20;

  const mainController = accounts[1];
  const sender = accounts[2];
  const recipient = accounts[3];

  beforeEach(async () => {
    tclRepository = await deployTclRepository(
      accounts,
      {account: mainController}
    );

    const params = {
      tclRepository: tclRepository.address,
      account: mainController
    };

    mockSuccess = await deployMockSuccessCheckpoint(accounts);
    mockFailure = await deployMockFailureCheckpoint(accounts);
    erc20 = await deployMockContract();

    tclController = await deployTclController(accounts, params);

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
  });

  it('should deal with a single checkpoint execution plan', async () => {
    const executionPlan = [checkpointCodes.mockSuccessCheckpoint];
    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});

    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should deal with an two checkpoints connected with AND one of which fails', async () => {
    const executionPlan = [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockFailureCheckpoint, operators.and];
    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});

    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal('Cannot transfer');
  });

  it('should deal with an two checkpoints connected with OR both of which fail', async () => {
    const executionPlan = [checkpointCodes.mockFailureCheckpoint, checkpointCodes.mockFailureCheckpoint, operators.or];
    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});

    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal('Cannot transfer');
  });

  it('should return false if the execution plan fails', async () => {
    const executionPlan = [checkpointCodes.mockFailureCheckpoint];
    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});

    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(false);
    expect(result[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result[2])).to.equal('Cannot transfer');
  });

  it('should return true based on a successful execution plan', async () => {
    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');
  });

  it('should return true for the first token and false for the second token', async () => {
    const executionPlan = [checkpointCodes.mockSuccessCheckpoint];
    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});

    const secondToken = await deployMockContract();
    const executionPlan2 = [checkpointCodes.mockFailureCheckpoint];
    await tclController.updateExecutionPlan(secondToken.address, executionPlan2, {from: mainController});

    const result = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );

    expect(result[0]).to.equal(true);
    expect(result[1]).to.equal(ethereumStatusCodes.successTransfer);
    expect(hexToUtf8(result[2])).to.equal('');

    // store checkpoint codes for the second token
    await tclRepository.addCheckpoint(
      secondToken.address,
      checkpointCodes.mockFailureCheckpoint,
      mockFailure.address,
      {from: mainController}
    );

    const result2 = await tclController.canTransfer.call(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      secondToken.address
    );

    expect(result2[0]).to.equal(false);
    expect(result2[1]).to.equal(ethereumStatusCodes.failureTransfer);
    expect(hexToUtf8(result2[2])).to.equal('Cannot transfer');
  })

  it('NOTE this is not a traditional test; we don not have assertions. We use this to check the gas cost', async () => {
    // execute to update the state. We called call before to receive the return value and not the tx receipt.
    // However .call doesn't update the state during the execution of the transaction; so we can't even
    // see the cost of this functions
    await tclController.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );
  });

  it('should run with a big number of checkpoints', async () => {
    const mockPostTransfer = await deployMockPostTransferCheckpoint(accounts, {account: tclController.address});
    await tclRepository.addCheckpoint(
      erc20.address,
			checkpointCodes.mockPostTransfer,
			mockPostTransfer.address,
			{from: mainController}
    );

    const bigExecutionPlan = getComplexExecutionPlan(100);

    await tclController.updateExecutionPlan(erc20.address, bigExecutionPlan, {from: mainController});
    await tclController.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );
  });

  it('should run with an empty execution plan', async () => {
    const executionPlan = getEmptyExecutionPlan();

    await tclController.updateExecutionPlan(erc20.address, executionPlan, {from: mainController});
    await tclController.canTransfer(
      sender,
      recipient,
      getTokens(100),
      hexToBytes(toHex('empty_bytes_data')),
      erc20.address
    );
  });
});
