const ClaimRegistry = artifacts.require('ClaimRegistry');
const {getDefaultAddress, getTclActors} = require('../../helpers/address');
const {
  encodeBytes32Param,
  hexToUtf8,
  soliditySha3
} = require('../../helpers/utils');

const ZERO_KEY = '0x0000000000000000000000000000000000000000000000000000000000000000';

const claimKeys = {
  country: encodeBytes32Param('countryOfResidence'),
  kycAml: encodeBytes32Param('kycAml'),
  isSPE: encodeBytes32Param('isSPE'),
  isAccreditedInvestor: encodeBytes32Param('isAccreditedInvestor')
};

const createAccountId = (...values) => soliditySha3(...values);

const createClaim = (value, issuer, validTo, provider = '0x0', providerProof = '0x0') => ({
  value: encodeBytes32Param(value),
  issuer,
  validTo,
  provider: encodeBytes32Param(provider),
  providerProof: encodeBytes32Param(providerProof)
});

const decodeClaimValue = value => hexToUtf8(value);

const deployClaimRegistry = async (accounts, params = {}) => {
  const defaultAccount = getDefaultAddress(accounts);

  const {
    account = getTclActors(accounts).mainController
  } = params;

  return await ClaimRegistry.new(
    account,
    {from: defaultAccount}
  );
};

const registerClaim = async (claimRegistry, holderAddress, claimKey, claimData, from) => {
  let accountId = await claimRegistry.getAccountId(holderAddress);

  if (accountId === ZERO_KEY) {
    accountId = createAccountId(holderAddress);
    await claimRegistry.registerAccount(
      accountId,
      holderAddress,
      {from}
    );
  }

  await claimRegistry.setClaim(
    accountId,
    claimKey,
    claimData,
    {from}
  );
};

const registerSpe = async (claimRegistry, speAddress, controllerAddress, claimData = {}) => {
  const {
    value = '1',
    expireDate = Number.MAX_SAFE_INTEGER
  } = claimData;

  const claim = createClaim(value, controllerAddress, expireDate);

  await registerClaim(
    claimRegistry,
    speAddress,
    claimKeys.isSPE,
    claim,
    controllerAddress
  );

  return {
    claimKey: claimKeys.isSPE,
    claim
  };
};

const registerKyc = async (claimRegistry, holderAddress, controllerAddress, claimData = {}) => {
  const {
    value = '1',
    expireDate = Number.MAX_SAFE_INTEGER
  } = claimData;

  const claim = createClaim(value, controllerAddress, expireDate);

  await registerClaim(
    claimRegistry,
    holderAddress,
    claimKeys.kycAml,
    claim,
    controllerAddress
  );

  return {
    claimKey: claimKeys.kycAml,
    claim
  };
};

const registerCountry = async (claimRegistry, holderAddress, controllerAddress, claimData = {}) => {
  const {
    value = 'GBR',
    expireDate = Number.MAX_SAFE_INTEGER
  } = claimData;

  const claim = createClaim(value, controllerAddress, expireDate);

  await registerClaim(
    claimRegistry,
    holderAddress,
    claimKeys.country,
    claim,
    controllerAddress
  );

  return {
    claimKey: claimKeys.country,
    claim
  };
};

// eslint-disable-next-line max-len
const registerAccreditedInvestor = async (claimRegistry, holderAddress, controllerAddress, claimData = {}) => {
  const {
    value = '1',
    expireDate = Number.MAX_SAFE_INTEGER
  } = claimData;

  const claim = createClaim(value, controllerAddress, expireDate);

  await registerClaim(
    claimRegistry,
    holderAddress,
    claimKeys.isAccreditedInvestor,
    claim,
    controllerAddress
  );

  return {
    claimKey: claimKeys.isAccreditedInvestor,
    claim
  };
};

module.exports = {
  claimKeys,
  createAccountId,
  createClaim,
  decodeClaimValue,
  deployClaimRegistry,
  registerSpe,
  registerKyc,
  registerCountry,
  registerAccreditedInvestor
};
