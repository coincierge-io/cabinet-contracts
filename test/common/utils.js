const ContractFactory = artifacts.require('ContractFactory');
const MockContractFactory = artifacts.require('MockContractFactory');
const {getDeployData} = require('../../../../js/packages/eth-utils/core/v1/tx');
const {getContract} = require('../../../../js/packages/eth-utils/contracts/v1/Contract');
const {soliditySha3} = require('../helpers/utils');

const deployMockContractFactory = async () => {
  const contractFactory = await ContractFactory.new();
  MockContractFactory.link('ContractFactory', contractFactory.address);

  return await MockContractFactory.new();
};

// deterministically computes the smart contract address given
// the account the will deploy the contract (factory contract)
// the salt as uint256 and the contract bytecode
const computeContractAddress = (saltHex, byteCode, deployerAddress) => web3.utils
  .toChecksumAddress(`0x${web3.utils.sha3(`0x${[
    'ff',
    deployerAddress,
    saltHex,
    web3.utils.soliditySha3(byteCode)
  ].map(x => x.replace(/0x/, '')).join('')}`).slice(-40)}`);

const getSaltHex = (salt = 'arbitrary salt value') => soliditySha3(salt);

const getContractDeployData = (contractDefinition, ...args) => getDeployData(
  getContract(contractDefinition),
  contractDefinition.bytecode,
  ...args
);

module.exports = {
  deployMockContractFactory,
  computeContractAddress,
  getSaltHex,
  getContractDeployData
};
