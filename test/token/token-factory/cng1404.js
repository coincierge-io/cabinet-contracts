const {
  deployTokenFactory,
  deployWhitelistOracle
} = require('../../helpers/deploy');
const {findEvent} = require('../../helpers/events');
const {expect} = require('../../../../common/test/helpers');
const {getTokenOwnerAddress} = require('../../../../common/test/helpers/address');

const CNG1404Token = artifacts.require('CNG1404');

contract('TokenFactory: DeployCNG1404', accounts => {
  let tokenFactory;
  let whitelistOracle;

  beforeEach(async () => {
    tokenFactory = await deployTokenFactory(accounts);
    whitelistOracle = await deployWhitelistOracle(accounts);
  });

  it('should deploy an cng1404 token with correct parameters', async () => {
    const {receipt: {logs}} = await tokenFactory
      .deployCNG1404(
        getTokenOwnerAddress(accounts),
        'testName',
        'ERC',
        5000000,
        whitelistOracle.address
      );

    const {args} = findEvent(logs, 'DeployCNG1404');
    const {tokenAddress} = args;
    const CNG1404Contract = await CNG1404Token.at(tokenAddress);
    const name = await CNG1404Contract.name.call();
    const symbol = await CNG1404Contract.symbol.call();
    const cap = await CNG1404Contract.cap.call();

    expect(name).to.be.equal('testName');
    expect(symbol).to.be.equal('ERC');
    expect(cap.toNumber()).to.be.equal(5000000);

    expect(1).to.be.equal(1);
  });
});
