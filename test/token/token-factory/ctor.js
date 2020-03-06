const TokenFactory = artifacts.require('TokenFactory');
const CappedMintableTokenFactory = artifacts.require('CappedMintableTokenFactory');
const CNG1400TokenFactory = artifacts.require('CNG1400TokenFactory');
const Bytes32Utils = artifacts.require('Bytes32Utils');

contract('TokenFactory: ctor', accounts => {
  it('should deploy new TokenFactory', async () => {
    await TokenFactory.new(accounts[0], accounts[0], accounts[0]);
  });

  it('should deploy new CappedMintableTokenFactory', async () => {
    await CappedMintableTokenFactory.new();
  });

  it('should deploy new CNG1400TokenFactory', async () => {
    const bytes32Utils = await Bytes32Utils.new();
    CNG1400TokenFactory.link('Bytes32Utils', bytes32Utils.address);

    return await CNG1400TokenFactory.new();
  });
});
