/* eslint-disable no-shadow */
const TclController = artifacts.require('TclController');
const TclExecution = artifacts.require('TclExecution');
const TclRepository = artifacts.require('TclRepository');
const ControllerRole = artifacts.require('ControllerRole');
const MockSuccessCheckpoint = artifacts.require('MockSuccessCheckpoint');
const MockFailureCheckpoint = artifacts.require('MockFailureCheckpoint');
const AccreditedInvestorCheckpoint = artifacts.require('AccreditedInvestorCheckpoint');
const MockPostTransfer = artifacts.require('MockPostTransfer');
const TimedKycAmlCheckpoint = artifacts.require('TimedKycAmlCheckpoint');
const KycAmlCheckpoint = artifacts.require('KycAmlCheckpoint');
const BlockedAccountCheckpoint = artifacts.require('BlockedAccountCheckpoint');
const CountryLimitCheckpoint = artifacts.require('CountryLimitCheckpoint');
const InvestorLimitCheckpoint = artifacts.require('InvestorLimitCheckpoint');
const SPEVerifier = artifacts.require('SPEVerifier');
const {getDefaultAddress, getTclActors} = require('../../helpers/address');
const {toHex, hexToBytes} = require('../../helpers/utils');
const {flatten} = require('../../../../js/packages/common/fn');
const {operators, ethereumStatusCodes, checkpointCodes} = require('../../../../js/packages/eth-utils/data/v1/checkpoint');
const {
  deployClaimRegistry,
  createAccountId,
  createClaim,
  claimKeys
} = require('../identity/utils');

const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

const checkpointsCodesExtended = {
  ...checkpointCodes,
  mockSuccessCheckpoint: 100,
  mockFailureCheckpoint: 200,
  mockPostTransfer: 300,
  mockPostTransfer2: 350
};

const getDefaultExecutionPlan = () => {
  const {mockSuccessCheckpoint, mockFailureCheckpoint} = checkpointsCodesExtended;
  const {or, and} = operators;

  // MockSuccess AND (MockSuccess OR MockFailure) in RPN
  return [mockSuccessCheckpoint, mockSuccessCheckpoint, mockFailureCheckpoint, or, and];
};

const getKycAmlExecutionPlan = () => {
  const {KycAmlCheckpoint} = checkpointsCodesExtended;

  return [KycAmlCheckpoint];
};

const getEmptyExecutionPlan = () => [];

const getComplexExecutionPlan = (checkpointCount = 75) => {
  const {mockSuccessCheckpoint, mockPostTransfer} = checkpointsCodesExtended;
  const {and} = operators;

  return flatten([mockSuccessCheckpoint, mockSuccessCheckpoint, and]
    .concat(
      Array.from(
        new Array(checkpointCount),
        () => [mockPostTransfer, and]
      )
    ));
};

const getExecutionPlanWithIPostTransfer = () => {
  const {mockSuccessCheckpoint, mockPostTransfer, mockPostTransfer2} = checkpointsCodesExtended;
  const {or, and} = operators;

  // MockSuccess AND (mockPostTransfer OR mockPostTransfer2) in RPN
  return [mockSuccessCheckpoint, mockPostTransfer, mockPostTransfer2, or, and];
};

const deployControllerRole = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account, controllerOf} = params;

  return await ControllerRole.new(
    account,
    controllerOf,
    {from: defaultAccount}
  );
};

const deployTclRepository = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await TclRepository.new(
    account,
    {from: defaultAccount}
  );
};

const deployTclController = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {tclRepository, account} = params;

  const tclExecution = await TclExecution.new();

  // link library
  TclController.link('TclExecution', tclExecution.address);

  return await TclController.new(
    tclRepository,
    account,
    {from: defaultAccount}
  );
};

const deployMockSuccessCheckpoint = async accounts => {
  const defaultAccount = getDefaultAddress(accounts);
  return await MockSuccessCheckpoint.new({from: defaultAccount});
};

const deployMockPostTransferCheckpoint = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await MockPostTransfer.new(account, {from: defaultAccount});
};

const deployMockFailureCheckpoint = async accounts => {
  const defaultAccount = getDefaultAddress(accounts);
  return await MockFailureCheckpoint.new({from: defaultAccount});
};

const deployTimedKycAmlCheckpoint = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await TimedKycAmlCheckpoint.new(
    account,
    {from: defaultAccount}
  );
};

const deployKycAmlCheckpoint = async (accounts, claimRegistryAddress, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await KycAmlCheckpoint.new(
    account,
    claimRegistryAddress,
    {from: defaultAccount}
  );
};

const deployAccreditedInvestorCheckpoint = async (accounts, claimRegistryAddress, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await AccreditedInvestorCheckpoint.new(
    account,
    claimRegistryAddress,
    {from: defaultAccount}
  );
};

const deployBlockAccountCheckpoint = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account} = params;

  return await BlockedAccountCheckpoint.new(
    account,
    {from: defaultAccount}
  );
};


const setupTclRepository = async (
  tclRepository,
  erc20Address,
  checkpointCodes,
  checkpointAddresses,
  mainController
) => {
  await tclRepository.addCheckpoints(
    erc20Address,
    checkpointCodes,
    checkpointAddresses,
    {from: mainController}
  );
};

const deployTclControllerWithDefaultCheckpoints = async accounts => {
  const {mainController, authorisedHolder, dodgyGuy} = getTclActors(accounts);
  const claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
  const kycAmlCheckpoint = await deployKycAmlCheckpoint(accounts, claimRegistry.address, {account: mainController});
  const claim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER);
  const authorisedHolderId = createAccountId(authorisedHolder);

  await claimRegistry.registerAccount(
    authorisedHolderId,
    authorisedHolder,
    {from: mainController}
  );

  await claimRegistry.setClaim(
    authorisedHolderId,
    claimKeys.kycAml,
    claim,
    {from: mainController}
  );

  const blockedAccountCheckpoint = await deployBlockAccountCheckpoint(accounts, {account: mainController});
  await blockedAccountCheckpoint.blockAccount(dodgyGuy, {from: mainController});

  const tclRepository = await deployTclRepository(accounts, {account: mainController});

  const tclControllerParams = {
    tclRepository: tclRepository.address,
    account: mainController
  };

  const tclController = await deployTclController(accounts, tclControllerParams);

  return {
    tclController,
    tclRepository,
    kycAmlCheckpoint,
    claimRegistry,
    blockedAccountCheckpoint
  };
};

const deployCountryLimitCheckpoint = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {account, claimRegistry} = params;

  return await CountryLimitCheckpoint.new(
    account,
    claimRegistry,
    {from: defaultAccount}
  );
};

const deployInvestorLimitCheckpoint = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);
  const {
    account,
    claimRegistry = await deployClaimRegistry(accounts)
  } = params;

  return await InvestorLimitCheckpoint.new(
    account,
    claimRegistry.address,
    {from: defaultAccount}
  );
};

const deploySpeVerifier = async (accounts, params = {}) => {
  const {
    claimRegistry = await deployClaimRegistry()
  } = params;

  return await SPEVerifier.new(claimRegistry.address);
};

module.exports = {
  operators,
  checkpointCodes: checkpointsCodesExtended,
  EMPTY_DATA,
  getDefaultExecutionPlan,
  getEmptyExecutionPlan,
  getComplexExecutionPlan,
  getExecutionPlanWithIPostTransfer,
  ethereumStatusCodes,
  deployControllerRole,
  deployTclRepository,
  deployTclController,
  deployMockSuccessCheckpoint,
  deployMockFailureCheckpoint,
  deployMockPostTransferCheckpoint,
  deployTimedKycAmlCheckpoint,
  deployKycAmlCheckpoint,
  deployBlockAccountCheckpoint,
  deployTclControllerWithDefaultCheckpoints,
  getKycAmlExecutionPlan,
  deployCountryLimitCheckpoint,
  deployInvestorLimitCheckpoint,
  deploySpeVerifier,
  deployAccreditedInvestorCheckpoint,
  setupTclRepository
};
