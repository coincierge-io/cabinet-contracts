const fs = require('fs');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {expect} = require('../../helpers');
const {deployTclRepository, checkpointCodes} = require('../utils');
const {getTclActors} = require('../../helpers/address');
const {deployMockContract} = require('../../helpers/deploy');
const {deployClaimRegistry} = require('../../identity/utils');
const {
  computeContractAddress,
  getSaltHex,
  getContractDeployData
} = require('../../common/utils');

const KycAmlCheckpointDefinition = JSON.parse(fs.readFileSync(`${process.cwd()}/build/contracts/KycAmlCheckpoint.json`, 'utf8'));

contract('TclRepository: deployCheckpoint', accounts => {
  const {mainController, dodgyGuy} = getTclActors(accounts);
  let erc20;
  let tclRepository;
  let contractDeployData;

  beforeEach(async () => {
    const params = {account: mainController};
    const claimRegistry = await deployClaimRegistry(accounts, params);
    erc20 = await deployMockContract();
    contractDeployData = getContractDeployData(KycAmlCheckpointDefinition, mainController, claimRegistry.address);
    tclRepository = await deployTclRepository(
      accounts,
      {account: mainController}
    );
  });

  it('should deploy a new checkpoint and add it to the repository', async () => {
    const offChainComputed = computeContractAddress(
      getSaltHex(),
      contractDeployData,
      tclRepository.address
    );

    await tclRepository.deployCheckpoint(
      erc20.address,
      checkpointCodes.KycAmlCheckpoint,
      contractDeployData,
      getSaltHex(),
      {from: mainController}
    );

    const kycAmlCheckpoint = await tclRepository.getCheckpoint.call(erc20.address, checkpointCodes.KycAmlCheckpoint);

    expect(kycAmlCheckpoint).to.be.equal(offChainComputed);
  });

  it('should revert if called by someone who doesn\'t have the Controller Role', async () => {
    // someone without the controller role trying to add himself
    await shouldFailWithMessage(
      tclRepository.deployCheckpoint(
        erc20.address,
        checkpointCodes.KycAmlCheckpoint,
        contractDeployData,
        getSaltHex(),
        {from: dodgyGuy}
      ),
      'Only controller role'
    );
  });
});
