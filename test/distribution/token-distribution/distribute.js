const {expectBignumberEqual} = require('../../../../common/test/helpers');
const {expectVMException, getTokens} = require('../../../../common/test/helpers/utils');
const {
  getContributor
} = require('../../../../common/test/helpers/address');
const {
  VALID_SIGNATURE_NONCE_0,
  INVALID_SIGNATURE,
  NONCE_0,
  MESSAGE
} = require('../../../../common/test/helpers/signatures');
const {deployTokenDistribution} = require('../../helpers/deploy');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');

contract('TokenDistribution: distribute', accounts => {
  let tokenInstance;
  let tokenDistribution;
  let tokenDistributionBalance;

  beforeEach(async () => {
    [tokenDistribution, tokenInstance] = await deployTokenDistribution(accounts);
    await tokenInstance.mint(tokenDistribution.address, getTokens(50000));

    tokenDistributionBalance = await tokenInstance.balanceOf(tokenDistribution.address);
  });

  it('should revert if the provided signature is invalid', async () => {
    const contributors = [
      getContributor(accounts, 3),
      getContributor(accounts, 4),
      getContributor(accounts, 5)
    ];
    const balances = [getTokens(10000), getTokens(20000), getTokens(20000)];

    await expectVMException(
      tokenDistribution.distribute(
        contributors,
        balances,
        INVALID_SIGNATURE,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should distribute tokens to the given list of accounts', async () => {
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
      MESSAGE
    );

    const contributor1Balance = await tokenInstance.balanceOf(getContributor(accounts, 3));
    const contributor2Balance = await tokenInstance.balanceOf(getContributor(accounts, 4));
    const contributor3Balance = await tokenInstance.balanceOf(getContributor(accounts, 5));


    expectBignumberEqual(contributor1Balance, getTokens(10000));
    expectBignumberEqual(contributor2Balance, getTokens(20000));
    expectBignumberEqual(contributor3Balance, getTokens(20000));
  });

  it('should revert if the same signature is used twice', async () => {
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
      MESSAGE
    );

    await expectVMException(
      tokenDistribution.distribute(
        contributors,
        balances,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should revert if there is no tokens are left', async () => {
    const largeAmount = tokenDistributionBalance
      .div(getTokens(1))
      .sub(getTokens(29999));

    const contributors = [
      getContributor(accounts, 3),
      getContributor(accounts, 4),
      getContributor(accounts, 5)
    ];
    const balances = [getTokens(10000), getTokens(20000), largeAmount];

    await expectVMException(
      tokenDistribution.distribute(
        contributors,
        balances,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should distribute to a big number of address', async () => {
    const contributors = Array.from(new Array(250), () => getContributor(accounts, 3));
    const balances = Array.from(new Array(250), () => 1);
    await tokenDistribution.distribute(
      contributors,
      balances,
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      MESSAGE
    );
  });

  it('should revert if the contributors and balances have diferent length', async () => {
    const contributors = [
      getContributor(accounts, 3),
      getContributor(accounts, 4),
      getContributor(accounts, 5)
    ];
    const balances = [getTokens(10000), getTokens(20000), getTokens(20000), getTokens(20000)];

    await shouldFailWithMessage(
      tokenDistribution.distribute(
        contributors,
        balances,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        MESSAGE
      ),
      'Array length mismatch'
    );
  });
});
