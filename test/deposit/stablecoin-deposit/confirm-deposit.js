const {deployDeposit} = require('./common');
const {expectBignumberEqual} = require('../../helpers');
const {Currencies} = require('../../helpers/deploy');
const {commonTests} = require('../../helpers/store-deposit');
const {
  getTokens,
  shouldFailWithMessage
} = require('../../helpers/utils');
const {getContributor, getNonWhitelistedAdress} = require('../../helpers/address');

contract('StablecoinDeposit: confirmDeposit', accounts => {
  let stablecoinDeposit;
  let daiToken;
  let trueUsdToken;
  const mainController = accounts[0];

  const deployDepositAndApprove = async () => {
    [stablecoinDeposit, daiToken] = await deployDeposit(
      accounts,
      {account: mainController}
    );
    await daiToken.approve(
      stablecoinDeposit.address,
      getTokens(500),
      {from: getContributor(accounts, 1)}
    );

    await daiToken.approve(
      stablecoinDeposit.address,
      getTokens(500),
      {from: getNonWhitelistedAdress(accounts)}
    );

    return stablecoinDeposit;
  };

  // Here we're also testing that the storeDeposit from the base contract is invoked
  describe('Common', async () => {
    const confirmDeposit = async (
      deposit,
      contributor,
      value = getTokens(100).toString()
    ) => await deposit.confirmDeposit(contributor, value, Currencies.DAI);

    commonTests(
      accounts,
      deployDepositAndApprove,
      confirmDeposit,
      Currencies.DAI,
      getTokens(100).toString()
    );
  });

  describe('And', async () => {
    beforeEach(async () => {
      [stablecoinDeposit, daiToken, trueUsdToken] = await deployDeposit(accounts);
    });

    it('should transfer the approved tokens to itself', async () => {
      await daiToken.approve(
        stablecoinDeposit.address,
        getTokens(100),
        {from: getContributor(accounts, 1)}
      );

      await stablecoinDeposit.confirmDeposit(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.DAI
      );

      const tokenBalance = await daiToken.balanceOf(stablecoinDeposit.address);

      expectBignumberEqual(tokenBalance, getTokens(100));
    });

    it('should revert if the given amount of tokens was not previously approved', async () => {
      // approve less that transfer
      await daiToken.approve(
        stablecoinDeposit.address,
        getTokens(99),
        {from: getContributor(accounts, 1)}
      );

      await shouldFailWithMessage(
        stablecoinDeposit.confirmDeposit(
          getContributor(accounts, 1),
          getTokens(100),
          Currencies.DAI
        ),
        'Beneficiary has not approved the given amount'
      );
    });

    it('should revert if the given currency is not present in the token repository', async () => {
      await shouldFailWithMessage(
        stablecoinDeposit.confirmDeposit(
          getContributor(accounts, 1),
          getTokens(100),
          'UNKNOWN_TOKEN'
        ),
        'Cannot find the given token'
      );
    });
  });
});
