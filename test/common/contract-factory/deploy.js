const fs = require('fs');
const {expect} = require('../../helpers');

const MockContractCtor = artifacts.require('MockContractCtor');
const {expectVMException} = require('../../helpers/utils');
const {
  deployMockContractFactory,
  computeContractAddress,
  getSaltHex,
  getContractDeployData
} = require('../utils');

const MockContractCtorDefinition = JSON.parse(fs.readFileSync(`${process.cwd()}/build/contracts/MockContractCtor.json`, 'utf8'));

contract('ContractFactory: deploy', accounts => {
  const deployerAccount = accounts[1];
  const value = 100;
  const mockContractBytecode = getContractDeployData(MockContractCtorDefinition, value);

  let factory;

  beforeEach(async () => {
    factory = await deployMockContractFactory();
  });

  it('should deploy with correct params', async () => {
    const offChainComputed = await computeContractAddress(getSaltHex(), mockContractBytecode, factory.address);
    await factory.deploy(getSaltHex(), mockContractBytecode, {from: deployerAccount});
    const mockContract = await MockContractCtor.at(offChainComputed);

    const val = await mockContract.value.call();
    expect(val.toNumber()).to.equal(value);
  });

  it('should revert when deploying a contract in existing address', async () => {
    await factory.deploy(getSaltHex(), mockContractBytecode, {from: deployerAccount});

    await expectVMException(
      factory.deploy(getSaltHex(), mockContractBytecode, {from: deployerAccount})
    );
  });
});
