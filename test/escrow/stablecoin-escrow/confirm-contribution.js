const {deployEscrow} = require('./common');
const {expectBignumberEqual} = require('../../helpers/');
const {Currencies} = require('../../helpers/deploy');
const {commonTests} = require('../../helpers/store-contribution');
const {getTokens, moveToOpeningTime, shouldFailWithMessage, expectInvalidOpCode} = require('../../helpers/utils');
const {getContributor, getNonWhitelistedAdress} = require('../../helpers/address');

contract('StablecoinEscrow: confirmContribution', accounts => {
  let stablecoinEscrow;
  let daiToken;
  let trueUsdToken;

  const deployEscrowAndApprove = async () => {
    [stablecoinEscrow, daiToken] = await deployEscrow(accounts);
    await daiToken.approve(
      stablecoinEscrow.address,
      getTokens(500),
      {from: getContributor(accounts, 1)}
    );

    await daiToken.approve(
      stablecoinEscrow.address,
      getTokens(500),
      {from: getNonWhitelistedAdress(accounts)}
    );

    return stablecoinEscrow;
  };

  // Here we're also testing that the storeContribution from the base contract is invoked
  describe('Common', async () => {
    const confirmContribution = async (
      escrow,
      contributor,
      value = getTokens(100).toString()
    ) => {
      return await escrow.confirmContribution(contributor, value, Currencies.DAI);
    };

    commonTests(
      accounts,
      deployEscrowAndApprove,
      confirmContribution,
      Currencies.DAI,
      getTokens(100).toString()
    );
  });

  describe('And', async () => {
    beforeEach(async () => {
      [stablecoinEscrow, daiToken, trueUsdToken] = await deployEscrow(accounts);
      await moveToOpeningTime(stablecoinEscrow);
    });

    it('should transfer the approved tokens to itself', async () => {
      await daiToken.approve(
        stablecoinEscrow.address,
        getTokens(100),
        {from: getContributor(accounts, 1)}
      );

      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.DAI
      );

      const tokenBalance = await daiToken.balanceOf(stablecoinEscrow.address);

      expectBignumberEqual(tokenBalance, getTokens(100));
    });

    it('should store the currency name in a list for future use', async () => {
      await daiToken.approve(
        stablecoinEscrow.address,
        getTokens(100),
        {from: getContributor(accounts, 1)}
      );

      await trueUsdToken.approve(
        stablecoinEscrow.address,
        getTokens(100),
        {from: getContributor(accounts, 1)}
      );

      // multiple currencies
      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.DAI
      );

      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.TRUE_USD
      );

      const dai = await stablecoinEscrow.tokenList(0);
      const trueUsd = await stablecoinEscrow.tokenList(1);

      expect(dai).to.be.equal(Currencies.DAI);
      expect(trueUsd).to.be.equal(Currencies.TRUE_USD);
    });

    it('should store the currency name just once in a list for future use', async () => {
      await daiToken.approve(
        stablecoinEscrow.address,
        getTokens(200),
        {from: getContributor(accounts, 1)}
      );

      await trueUsdToken.approve(
        stablecoinEscrow.address,
        getTokens(100),
        {from: getContributor(accounts, 1)}
      );

      // multiple currencies
      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.DAI
      );

      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.TRUE_USD
      );

      await stablecoinEscrow.confirmContribution(
        getContributor(accounts, 1),
        getTokens(100),
        Currencies.DAI
      );

      const dai = await stablecoinEscrow.tokenList(0);
      const trueUsd = await stablecoinEscrow.tokenList(1);

      expect(dai).to.be.equal(Currencies.DAI);
      expect(trueUsd).to.be.equal(Currencies.TRUE_USD);

      // should fail as an access to not existing index reverts
      await expectInvalidOpCode(
        stablecoinEscrow.tokenList(2)
      );
    });

    it('should revert if the given amount of tokens was not previously approved', async () => {
      // approve less that transfer
      await daiToken.approve(
        stablecoinEscrow.address,
        getTokens(99),
        {from: getContributor(accounts, 1)}
      );

      await shouldFailWithMessage(
        stablecoinEscrow.confirmContribution(
          getContributor(accounts, 1),
          getTokens(100),
          Currencies.DAI
        ),
        'Beneficiary has not approved the given amount'
      );
    });

    it('should revert if the given currency is not present in the token repository', async () => {
      await shouldFailWithMessage(
        stablecoinEscrow.confirmContribution(
          getContributor(accounts, 1),
          getTokens(100),
          'UNKNOWN_TOKEN'
        ),
        'Cannot find the given token'
      );
    });
  });
});
