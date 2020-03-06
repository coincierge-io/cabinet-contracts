const TokenDistribution = artifacts.require('TokenDistribution');
const {expect} = require('../../../../common/test/helpers');
const {expectVMException} = require('../../../../common/test/helpers/utils');
const {ZERO_ADDRESS, getContributor, getDefaultAddress} = require('../../../../common/test/helpers/address');
const {findEvent} = require('../../helpers/events');
const {
  deployTokenDistributionFactory,
  deployCappedMintableToken
} = require('../../helpers/deploy');

contract('TokenDistributionFactory: deploy', accounts => {
  let tokenDistributionFactory;
  let token;

  beforeEach(async () => {
    tokenDistributionFactory = await deployTokenDistributionFactory(accounts);
    token = await deployCappedMintableToken(accounts);
  });

  it('should deploy and store the token distribution contract', async () => {
    await tokenDistributionFactory.deploy(token.address, {from: getDefaultAddress(accounts)});
    const tokenDistribution = await tokenDistributionFactory.getTokenDistributionData(token.address);

    expect(tokenDistribution).to.not.equal(ZERO_ADDRESS);
  });

  it('should emit the LogTokenDistributionDeployed event', async () => {
    const {receipt: {logs}} = await tokenDistributionFactory.deploy(token.address, {from: getDefaultAddress(accounts)});
    const tokenDistribution = await tokenDistributionFactory.getTokenDistributionData(token.address);
    const logContent = findEvent(logs, 'LogTokenDistributionDeployed');

    expect(logContent.args.token).to.equal(token.address);
    expect(logContent.args.tokenDistribution).to.equal(tokenDistribution);
  });

  it('should transfer the ownership of the token distirbution contract to the owner of the factory contract', async () => {
    await tokenDistributionFactory.deploy(token.address, {from: getDefaultAddress(accounts)});
    const tokenDistribution = await tokenDistributionFactory.getTokenDistributionData(token.address);
    const tokenDistributionInstance = await TokenDistribution.at(tokenDistribution);
    const owner = await tokenDistributionInstance.owner.call();

    expect(owner).to.equal(getDefaultAddress(accounts));
  });

  it('should revert if the given erc20 address is not a contract address', async () => {
    await expectVMException(
      tokenDistributionFactory.deploy(getContributor(accounts, 2), {from: getDefaultAddress(accounts)})
    );
  });

  it('should revert if there is already an token distirbution contract for the given erc20', async () => {
    await tokenDistributionFactory.deploy(token.address, {from: getDefaultAddress(accounts)});

    await expectVMException(
      tokenDistributionFactory.deploy(token.address, {from: getDefaultAddress(accounts)})
    );
  });
});
