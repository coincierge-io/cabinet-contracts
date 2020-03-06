const IssuerRole = artifacts.require('IssuerRole');
const {getDefaultAddress, getTclActors} = require('../../../common/test/helpers/address');
const {deployAndSetupCng1400} = require('../helpers/deploy');
const {toHex, hexToBytes} = require('../../../common/test/helpers/utils');
const {
  deployCountryLimitCheckpoint, 
  deployMockSuccessCheckpoint,
  deployMockPostTransferCheckpoint,
  getComplexExecutionPlan,
  checkpointCodes
} = require('../tcl/utils');
const {
  deployClaimRegistry,
  claimKeys,
  createClaim,
  createAccountId
} = require('../identity/utils');

const deployIssuerRole = async (accounts, params={}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await IssuerRole.new(
    account,
    {from: defaultAccount}
  )
}

const setupCountryLimitCheckpoint = async (accounts, sender, recipient, recipient2) => {
  const {mainController} = getTclActors(accounts);
  const claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
  const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
  const accountId2 = createAccountId('Pav', 'Polianidis', 'pavlos@gmail.com');
  const accountId3 = createAccountId('Pav', 'Polianidis', 'pav@gmail.com');
  
  const claim = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
  const claim2 = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);
  const claim3 = createClaim('GRC', mainController, Number.MAX_SAFE_INTEGER);

  // setup country of residency claims
  await claimRegistry.setClaims(
    [accountId, accountId2, accountId3],
    [claimKeys.country, claimKeys.country, claimKeys.country],
    [claim, claim2, claim3],
    {from: mainController}
  );

  await claimRegistry.registerAccount(
    accountId,
    sender,
    {from: mainController}
  );

  await claimRegistry.registerAccount(
    accountId2,
    recipient,
    {from: mainController}
  );

  await claimRegistry.registerAccount(
    accountId3,
    recipient2,
    {from: mainController}
  );

  const {cng1400, tclController, tclRepository} = await deployAndSetupCng1400(accounts, {claimRegistry});
  
  const countryLimitCheckpoint = await deployCountryLimitCheckpoint(
    accounts,
    {account: tclController.address, claimRegistry: claimRegistry.address},
    {from: mainController}
  );

  const callData = countryLimitCheckpoint.contract
    .methods
    .addLimits(
      [hexToBytes(toHex('GRC'))],
      [2]
    )
    .encodeABI();

  await tclController.manageCheckpoint(
    countryLimitCheckpoint.address, 
    callData, 
    {from: mainController}
  );

  await tclRepository.addCheckpoints(
    cng1400.address,
    [checkpointCodes.CountryLimitCheckpoint],
    [countryLimitCheckpoint.address],
    {from: mainController}
  );

  await tclController.updateExecutionPlan(
    cng1400.address, 
    [checkpointCodes.CountryLimitCheckpoint],
    {from: mainController}
  );

  return {cng1400, countryLimitCheckpoint};
};

const deployTclControllerWithComplexExecutionPlan = async (accounts, checkpointCount) => {
  const {mainController} = getTclActors(accounts);
  const mockSuccess = await deployMockSuccessCheckpoint(accounts);
  const {cng1400, tclController, tclRepository} = await deployAndSetupCng1400(accounts);
  const mockPostTransfer = await deployMockPostTransferCheckpoint(accounts, {account: tclController.address});

  await tclRepository.addCheckpoints(
    cng1400.address,
    [checkpointCodes.mockSuccessCheckpoint, checkpointCodes.mockPostTransfer],
    [mockSuccess.address, mockPostTransfer.address],
    {from: mainController}
  );

  await tclController.updateExecutionPlan(
    cng1400.address, 
    getComplexExecutionPlan(checkpointCount),
    {from: mainController}
  )

  return tclController;
};

module.exports = {
  deployIssuerRole,
  setupCountryLimitCheckpoint,
  deployTclControllerWithComplexExecutionPlan
}
