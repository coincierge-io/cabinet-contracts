const {expect, expectBignumberEqual} = require('../../helpers');
const {deployDeposit} = require('./common');
const {Currencies} = require('../../helpers/deploy');
const {getContributor, getWalletAddress} = require('../../helpers/address');
const {getTokens, shouldFailWithMessage} = require('../../helpers/utils');
const {getTokenBalance} = require('../../helpers/utils');
const {findEvent} = require('../../helpers/events');

contract('StablecoinDeposit: release', accounts => {
  let stablecoinDeposit;
  let trueUsdToken;
  const mainController = accounts[0];

  const approve = async () => {
    await trueUsdToken.approve(
      stablecoinDeposit.address,
      getTokens(100),
      {from: getContributor(accounts, 1)}
    );
  
    await stablecoinDeposit.confirmDeposit(
      getContributor(accounts, 1),
      getTokens(100),
      Currencies.TRUE_USD
    );
  };

  beforeEach(async () => {
    [stablecoinDeposit, _, trueUsdToken] = await deployDeposit(accounts);
  });

  it('should transfer the specified amount of stablecoin to the wallet address', async () => {
    await approve();

    const balanceBefore = await getTokenBalance(trueUsdToken, getWalletAddress(accounts));

    await stablecoinDeposit.release(
      getContributor(accounts, 1),
      getTokens(100),
      Currencies.TRUE_USD,
      {from: mainController}
    );

    const balance = await getTokenBalance(trueUsdToken, getWalletAddress(accounts));

    expectBignumberEqual(balance, balanceBefore.add(getTokens(100)));
  });

  it('should revert if there is not enough balance', async () => {
    await approve();

    await shouldFailWithMessage(
      stablecoinDeposit.release(
        getContributor(accounts, 1),
        getTokens(200),
        Currencies.TRUE_USD,
        {from: mainController}
      ),
      `Cannot release more than the account's balance`
    );
  });

  it('should emit a release event', async () => {
    await approve();

    const {receipt: {logs}} = await stablecoinDeposit.release(
      getContributor(accounts, 1),
      getTokens(100),
      Currencies.TRUE_USD,
      {from: mainController}
    );

    const {args} = await findEvent(logs, 'Release');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expectBignumberEqual(args.value, getTokens(100));
    expect(args.currency).to.equal(Currencies.TRUE_USD);
  });
});
