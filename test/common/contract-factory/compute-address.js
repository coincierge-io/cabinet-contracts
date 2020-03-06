const fs = require('fs');
const {expect} = require('../../helpers');
const {
  deployMockContractFactory,
  computeContractAddress,
  getSaltHex,
  getContractDeployData
} = require('../utils');

const MockContractCtor = JSON.parse(fs.readFileSync(`${process.cwd()}/build/contracts/MockContractCtor.json`, 'utf8'));

contract('ContractFactory: computeAddress', () => {
  const value = 100;
  const mockContractBytecode = getContractDeployData(MockContractCtor, value);

  let factory;

  beforeEach(async () => {
    factory = await deployMockContractFactory();
  });

  it('should return the correct contract address', async () => {
    const onChainComputed = await factory.computeAddress(getSaltHex(), mockContractBytecode);
    const offChainComputed = await computeContractAddress(getSaltHex(), mockContractBytecode, factory.address);

    expect(onChainComputed).to.be.equal(offChainComputed);
  });

  it('should return the correct address when the deployer parameter is passed', async () => {
    const onChainComputed = await factory.computeAddress(getSaltHex(), mockContractBytecode, factory.address);
    const offChainComputed = await computeContractAddress(getSaltHex(), mockContractBytecode, factory.address);

    expect(onChainComputed).to.be.equal(offChainComputed);
  });
});
