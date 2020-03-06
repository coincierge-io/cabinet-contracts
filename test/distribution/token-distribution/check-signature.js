const {getTokens} = require('../../helpers/utils');
const {
  getContributor
} = require('../../helpers/address');
const {
  VALID_SIGNATURE_NONCE_0,
  INVALID_SIGNATURE,
  NONCE_0
} = require('../../helpers/signatures');
const {deployTokenDistribution} = require('../../helpers/deploy');

contract('TokenDistribution: checkSignature', accounts => {
  let tokenInstance;
  let tokenDistribution;
  const message = 'distribution';

  beforeEach(async () => {
    [tokenDistribution, tokenInstance] = await deployTokenDistribution(accounts);
    await tokenInstance.mint(tokenDistribution.address, getTokens(50000));

    tokenDistributionBalance = await tokenInstance.balanceOf(tokenDistribution.address);
  });

  it('should return false if the provided signature is invalid', async () => {
    const result = await tokenDistribution.checkSignature(
      INVALID_SIGNATURE,
      NONCE_0,
      message
    );
    expect(result).to.be.equal(false);
  });

  it('should return true if the signature is valid', async () => {
    const result = await tokenDistribution.checkSignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      message
    );

    expect(result).to.be.equal(true);
  });

  it('should return false if the same nonce is used twice', async () => {
    const contributors = [
      getContributor(accounts, 3),
      getContributor(accounts, 4),
      getContributor(accounts, 5)
    ];
    const balances = [getTokens(10000), getTokens(20000), getTokens(20000)];

    await tokenDistribution.distribute(
      contributors,
      balances,
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      message
    );

    const result = await tokenDistribution.checkSignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      message
    );
    expect(result).to.be.equal(false);
  });

  it('should return false if the message is not the one used in the signature', async () => {
    const result = await tokenDistribution.checkSignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      'message'
    );
    expect(result).to.be.equal(false);
  });
});
