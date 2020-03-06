/* eslint-disable no-shadow */
const MockContract = artifacts.require('MockContract');
const CappedMintableToken = artifacts.require('CappedMintableToken');
const TokenDistribution = artifacts.require('TokenDistribution');
const TokenVestingFactory = artifacts.require('TokenVestingFactory');
const TokenRepository = artifacts.require('TokenRepository');
const EscrowManager = artifacts.require('EscrowManager');
const BasicEscrow = artifacts.require('BasicEscrow');
const EthEscrow = artifacts.require('EthEscrow');
const StablecoinEscrow = artifacts.require('StablecoinEscrow');
const CrowdsaleEscrow = artifacts.require('CrowdsaleEscrow');
const WhitelistOracle = artifacts.require('WhitelistOracle');
const TokenDistributionFactory = artifacts.require('TokenDistributionFactory');
const TokenFactory = artifacts.require('TokenFactory');
const TimeGuard = artifacts.require('TimeGuard');
const SignatureVerifier = artifacts.require('SignatureVerifier');
const BasicDeposit = artifacts.require('BasicDeposit');
const EthDeposit = artifacts.require('EthDeposit');
const StablecoinDeposit = artifacts.require('StablecoinDeposit');
const DepositManager = artifacts.require('DepositManager');
const CappedMintableTokenFactory = artifacts.require('CappedMintableTokenFactory');
const CNG1400TokenFactory = artifacts.require('CNG1400TokenFactory');
const CNG1404 = artifacts.require('CNG1404');
const CNG1400 = artifacts.require('CNG1400');
const ERC1594 = artifacts.require('ERC1594');
const TclExecution = artifacts.require('TclExecution');
const Bytes32Utils = artifacts.require('Bytes32Utils');
const AtomicSwap = artifacts.require('AtomicSwap');
const AccessControl = artifacts.require('AccessControl');
const MockRestrictedAccess = artifacts.require('MockRestrictedAccess');
const AssetRepository = artifacts.require('AssetRepository');
const {add} = require('../../../common/test/helpers/date');
const {
  getWalletAddress,
  getDefaultAddress,
  getContributor,
  getTclActors
} = require('../../../common/test/helpers/address');
const {million, getTokens} = require('../../../common/test/helpers/utils');
const {
  setupTclRepository,
  deployTclControllerWithDefaultCheckpoints,
  checkpointCodes,
  operators
} = require('../tcl/utils');
const {
  createAccountId,
  createClaim,
  claimKeys
} = require('../identity/utils');

let run = 0;

const tokenAvailableForSaleInMillions = 300;
const totalSupplyInMillions = 400;

const Currencies = {
  ETH: 'ETH',
  DAI: 'DAI',
  TRUE_USD: 'TRUE_USD'
};

const deployMockContract = () => MockContract.new();

const deployWhitelistOracle = async accounts => {
  const from = getDefaultAddress(accounts);
  const whitelistOracle = await WhitelistOracle.new({from});

  // whitelist the addresses that are used in the test
  await whitelistOracle.addAddressesToWhitelist([
    getContributor(accounts, 1),
    getContributor(accounts, 2),
    getContributor(accounts, 3)
  ], {from});

  return whitelistOracle;
};

const deployCrowdsaleEscrow = async (accounts, params = {}) => {
  const tokenName = 'Reference Token';
  const tokenSymbol = 'RFT';

  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10),
    wallet = getWalletAddress(accounts),
    tokenAvailableForSaleInMillions = 300,
    totalSupplyInMillions = 400
  } = params;

  const whitelistOracle = await deployWhitelistOracle(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  run += 1;

  return await CrowdsaleEscrow.new(
    tokenName,
    tokenSymbol,
    tokenAvailableForSaleInMillions,
    totalSupplyInMillions,
    openingTime,
    closingTime,
    wallet,
    whitelistOracle.address,
    {from: defaultAccount}
  );
};

const deployErc1594 = async (accounts, params = {}) => {
  const {tclController} = params;

  const bytes32Utils = await Bytes32Utils.new();
  ERC1594.link('Bytes32Utils', bytes32Utils.address);

  return await ERC1594.new(tclController);
};

const deployCng1400 = async (accounts, params = {}) => {
  const {issuer} = getTclActors(accounts);
  const {
    tclController,
    claimRegistry,
    name = 'Controlled Token',
    symbol = 'CTRT',
    decimals = 18
  } = params;

  const bytes32Utils = await Bytes32Utils.new();
  CNG1400.link('Bytes32Utils', bytes32Utils.address);

  return await CNG1400.new(
    tclController.address,
    claimRegistry.address,
    issuer,
    name,
    symbol,
    decimals
  );
};

const deployAndSetupCng1400 = async (accounts, params = {}) => {
  const {mainController, issuer} = getTclActors(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  // 1. deploy the basic components of the tcl layer
  const {
    tclController: newTclController,
    claimRegistry: newClaimRegistry,
    tclRepository,
    kycAmlCheckpoint,
    blockedAccountCheckpoint
  } = await deployTclControllerWithDefaultCheckpoints(accounts);

  // 2. deploy security token
  const {
    tclController = newTclController,
    claimRegistry = newClaimRegistry
  } = params;

  const deployParams = {
    ...params,
    tclController,
    claimRegistry
  };

  const cng1400 = await deployCng1400(accounts, deployParams);

  // 3. setup the tcl repository for the above token
  const {
    KycAmlCheckpoint: kycAmlCheckpointCode,
    BlockedAccountCheckpoint: blockedAccountCheckpointCode
  } = checkpointCodes;

  await setupTclRepository(
    tclRepository,
    cng1400.address,
    [kycAmlCheckpointCode, blockedAccountCheckpointCode],
    [kycAmlCheckpoint.address, blockedAccountCheckpoint.address],
    mainController
  );

  // 4. update execution plan
  await tclController.updateExecutionPlan(
    cng1400.address,
    [kycAmlCheckpointCode, blockedAccountCheckpointCode, operators.and],
    {from: mainController}
  );

  // 4. register claims for the test investors
  const claim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER);
  const issuerId = createAccountId(issuer);
  const defaultAccountId = createAccountId(defaultAccount);

  await claimRegistry.registerAccount(
    issuerId,
    issuer,
    {from: mainController}
  );

  await claimRegistry.setClaim(
    issuerId,
    claimKeys.kycAml,
    claim,
    {from: mainController}
  );

  await claimRegistry.registerAccount(
    defaultAccountId,
    defaultAccount,
    {from: mainController}
  );

  await claimRegistry.setClaim(
    defaultAccountId,
    claimKeys.kycAml,
    claim,
    {from: mainController}
  );

  return {
    tclController,
    claimRegistry,
    cng1400,
    tclRepository,
    kycAmlCheckpoint,
    blockedAccountCheckpoint
  };
};

const deployErc1594WithDefaultTcl = async accounts => {
  const {mainController, issuer} = getTclActors(accounts);
  const defaultAccount = getDefaultAddress(accounts);
  const {
    tclController,
    claimRegistry,
    ...rest
  } = await deployTclControllerWithDefaultCheckpoints(accounts);
  const erc1594 = await deployErc1594(accounts, {tclController: tclController.address});

  const claim = createClaim('1', mainController, Number.MAX_SAFE_INTEGER);
  const issuerId = createAccountId(issuer);
  const defaultAccountId = createAccountId(defaultAccount);

  await claimRegistry.registerAccount(
    issuerId,
    issuer,
    {from: mainController}
  );

  await claimRegistry.setClaim(
    issuerId,
    claimKeys.kycAml,
    claim,
    {from: mainController}
  );

  await claimRegistry.registerAccount(
    defaultAccountId,
    defaultAccount,
    {from: mainController}
  );

  await claimRegistry.setClaim(
    defaultAccountId,
    claimKeys.kycAml,
    claim,
    {from: mainController}
  );

  return {
    tclController,
    claimRegistry,
    erc1594,
    ...rest
  };
};

const deployTokenRepository = async accounts => {
  const defaultAccount = getDefaultAddress(accounts);
  return await TokenRepository.new({from: defaultAccount});
};

const deployBasicEscrow = async (accounts, params = {}) => {
  const whitelistOracleInst = await deployWhitelistOracle(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10),
    wallet = getWalletAddress(accounts),
    whitelistOracle = whitelistOracleInst.address
  } = params;


  run += 1;

  return await BasicEscrow.new(
    openingTime,
    closingTime,
    wallet,
    whitelistOracle,
    {from: defaultAccount}
  );
};

const deployEthEscrow = async (accounts, params = {}) => {
  const whitelistOracleInst = await deployWhitelistOracle(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10),
    wallet = getWalletAddress(accounts),
    whitelistOracle = whitelistOracleInst.address
  } = params;


  run += 1;

  return await EthEscrow.new(
    openingTime,
    closingTime,
    wallet,
    whitelistOracle,
    {from: defaultAccount}
  );
};

const deployStablecoinEscrow = async (accounts, params = {}) => {
  const whitelistOracleInst = await deployWhitelistOracle(accounts);
  const tokenRepositoryInst = await deployTokenRepository(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10),
    wallet = getWalletAddress(accounts),
    whitelistOracle = whitelistOracleInst.address,
    tokenRepository = tokenRepositoryInst.address
  } = params;


  run += 1;

  return await StablecoinEscrow.new(
    openingTime,
    closingTime,
    wallet,
    whitelistOracle,
    tokenRepository,
    {from: defaultAccount}
  );
};

const deployEscrowManager = async (accounts, params = {}) => {
  const tokenName = 'Reference Token';
  const tokenSymbol = 'RFT';

  const whitelistOracleInst = await deployWhitelistOracle(accounts);
  const tokenRepositoryInst = await deployTokenRepository(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10),
    wallet = getWalletAddress(accounts),
    tokenAvailableForSaleInMillions = 300,
    totalSupplyInMillions = 400,
    tokenRepository = tokenRepositoryInst.address,
    whitelistOracle = whitelistOracleInst.address
  } = params;

  run += 1;

  return await EscrowManager.new(
    tokenName,
    tokenSymbol,
    tokenAvailableForSaleInMillions,
    totalSupplyInMillions,
    openingTime,
    closingTime,
    wallet,
    whitelistOracle,
    tokenRepository,
    {from: defaultAccount}
  );
};

const deployTimeGuard = async (accounts, params = {}) => {
  const {
    openingTime = add(run * 10 + 1),
    closingTime = add((run + 1) * 10)
  } = params;

  const defaultAccount = getDefaultAddress(accounts);

  return await TimeGuard.new(openingTime, closingTime, {from: defaultAccount});
};

const deployCappedMintableToken = async (accounts, cap = million(400)) => {
  const defaultAccount = getDefaultAddress(accounts);
  const tokenName = 'Reference Token';
  const tokenSymbol = 'RFT';

  return await CappedMintableToken.new(
    tokenName,
    tokenSymbol,
    cap,
    {from: defaultAccount}
  );
};

const deployTokenDistribution = async accounts => {
  const from = getDefaultAddress(accounts);
  const erc20 = await deployCappedMintableToken(accounts);
  const tokenDistribution = await TokenDistribution.new(erc20.address, {from});

  return [tokenDistribution, erc20];
};

const deployTokenDistributionFactory = async accounts => {
  const from = getDefaultAddress(accounts);
  return await TokenDistributionFactory.new({from});
};

const deployTokenVestingFactory = async () => await TokenVestingFactory.new();

const deployAssetRepository = async () => await AssetRepository.new();

const deployTokenFactory = async (accounts, _assetRepositoryInstance) => {
  let assetRepositoryInstance = _assetRepositoryInstance;
  if (!assetRepositoryInstance) {
    assetRepositoryInstance = await deployAssetRepository();
  }
  const assetRepositoryAddress = assetRepositoryInstance.address;
  const {mainController} = getTclActors(accounts);
  const tclExecution = await TclExecution.new();
  const erc20FactoryInstance = await CappedMintableTokenFactory.new();
  const bytes32Utils = await Bytes32Utils.new();

  // link library
  CNG1400TokenFactory.link('TclExecution', tclExecution.address);
  CNG1400TokenFactory.link('Bytes32Utils', bytes32Utils.address);

  const cng1400FactoryInstance = await CNG1400TokenFactory.new();

  const tokenFactoryInstance = await TokenFactory.new(
    erc20FactoryInstance.address,
    cng1400FactoryInstance.address,
    assetRepositoryAddress,
    {from: mainController}
  );
  await assetRepositoryInstance.addController(tokenFactoryInstance.address);

  return tokenFactoryInstance;
};

const deploySignatureverifier = async accounts => {
  const from = getDefaultAddress(accounts);
  return await SignatureVerifier.new({from});
};

const deployBasicDeposit = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);

  const {
    wallet = getWalletAddress(accounts)
  } = params;

  return await BasicDeposit.new(
    wallet,
    {from: defaultAccount}
  );
};

const deployEthDeposit = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);

  const {
    wallet = getWalletAddress(accounts)
  } = params;

  return await EthDeposit.new(
    wallet,
    {from: defaultAccount}
  );
};

const deployStablecoinDeposit = async (accounts, params = {}) => {
  const tokenRepositoryInstance = await deployTokenRepository(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    wallet = getWalletAddress(accounts),
    tokenRepository = tokenRepositoryInstance.address
  } = params;

  return await StablecoinDeposit.new(
    wallet,
    tokenRepository,
    {from: defaultAccount}
  );
};

const deployDepositManager = async (accounts, params = {}) => {
  const {dodgyGuy, authorisedHolder, mainController} = getTclActors(accounts);

  const tokenRepositoryInst = await deployTokenRepository(accounts);

  const {
    wallet = getWalletAddress(accounts),
    tokenRepository = tokenRepositoryInst,
    owner = mainController
  } = params;

  const depositManager = await DepositManager.new(
    wallet,
    tokenRepository.address,
    owner
  );

  const ethDepositAddress = await depositManager.ethDeposit();
  const ethDeposit = await EthDeposit.at(ethDepositAddress);

  const stablecoinDepositAddress = await depositManager.stablecoinDeposit();
  const stablecoinDeposit = await StablecoinDeposit.at(stablecoinDepositAddress);

  const daiToken = await deployCappedMintableToken(accounts);
  const trueUsdToken = await deployCappedMintableToken(accounts);

  // mint tokens
  await daiToken.mint(authorisedHolder, getTokens(500));
  await trueUsdToken.mint(getContributor(accounts, 1), getTokens(500));

  // the non whitelisted address
  await daiToken.mint(dodgyGuy, getTokens(500));

  // register stablecoins
  await tokenRepository.registerToken(Currencies.DAI, daiToken.address);
  await tokenRepository.registerToken(Currencies.TRUE_USD, trueUsdToken.address);

  // return [stablecoinDeposit, daiToken, trueUsdToken];

  return {
    depositManager,
    stablecoinDeposit,
    ethDeposit,
    daiToken,
    trueUsdToken
  };
};

const deployCng1404 = async (accounts, params = {}) => {
  const whitelistOracleInst = await deployWhitelistOracle(accounts);
  const defaultAccount = getDefaultAddress(accounts);

  const {
    name,
    symbol,
    cap,
    whitelistOracle = whitelistOracleInst.address
  } = params;

  return await CNG1404.new(
    name,
    symbol,
    cap,
    whitelistOracle,
    {from: defaultAccount}
  );
};

const deployAtomicSwap = async accounts => {
  const defaultAccount = getDefaultAddress(accounts);

  return await AtomicSwap.new({from: defaultAccount});
};

const deployAccessControl = async accounts => {
  const {mainController} = getTclActors(accounts);

  const accessControl = await AccessControl.new();
  await accessControl.addSigner(mainController);

  return accessControl;
};

const deployMockRestrictedAccess = async accounts => {
  const {mainController} = getTclActors(accounts);

  const accessControl = await MockRestrictedAccess.new();
  await accessControl.addSigner(mainController);

  return accessControl;
};

module.exports = {
  totalSupplyInMillions,
  tokenAvailableForSaleInMillions,
  deployMockContract,
  deployCrowdsaleEscrow,
  deployTokenRepository,
  deployEscrowManager,
  deployBasicEscrow,
  deployEthEscrow,
  deployStablecoinEscrow,
  deployTimeGuard,
  deployWhitelistOracle,
  deployCappedMintableToken,
  deployTokenDistribution,
  deployTokenDistributionFactory,
  deployTokenVestingFactory,
  Currencies,
  deployTokenFactory,
  deploySignatureverifier,
  deployBasicDeposit,
  deployEthDeposit,
  deployStablecoinDeposit,
  deployDepositManager,
  deployCng1404,
  deployErc1594,
  deployCng1400,
  deployAndSetupCng1400,
  deployErc1594WithDefaultTcl,
  deployAtomicSwap,
  deployAccessControl,
  deployMockRestrictedAccess,
  deployAssetRepository
};
