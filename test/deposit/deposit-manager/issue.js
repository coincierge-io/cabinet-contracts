const {expect, expectBignumberEqual} = require('../../helpers');
const {getTclActors} = require('../../helpers/address');
const {deployDepositManager, deployAndSetupCng1400, Currencies} = require('../../helpers/deploy');
const {registerSpe} = require('../../identity/utils');
const {
  toWei,
  getBalance,
  getTokens,
  shouldFailWithMessage
} = require('../../helpers/utils');

contract('DepositManager: issue', accounts => {
  let depositManager;
  let ethDeposit;
  let stablecoinDeposit;
  let claimRegistry;
  let cng1400;
  let daiToken;
  const {mainController, issuer, authorisedHolder} = getTclActors(accounts);

  beforeEach(async () => {
    ({
      depositManager,
      daiToken,
      ethDeposit,
      stablecoinDeposit
    } = await deployDepositManager(accounts));

    ({cng1400, claimRegistry} = await deployAndSetupCng1400(accounts));

    await cng1400.addIssuer(depositManager.address, {from: issuer});
    await registerSpe(claimRegistry, depositManager.address, mainController);
  });

  it('should revert if DepositManager is not the issuer', async () => {
    await cng1400.removeIssuer(depositManager.address, {from: issuer});

    await shouldFailWithMessage(
      depositManager.issue(authorisedHolder, 10, getTokens(15), 'ETH', cng1400.address, {from: mainController}),
      'Only issuer role.'
    );
  });

  it('should issue token to beneficiary and send ETH to wallet', async () => {
    let depositBalance;
    let tokenBalance;
    const value = toWei(1, 'ether');
    await ethDeposit.sendTransaction({value, from: authorisedHolder});

    tokenBalance = await cng1400.balanceOf(authorisedHolder);
    expect(tokenBalance.toNumber()).to.equal(0);

    depositBalance = await getBalance(ethDeposit.address);
    expect(depositBalance).to.equal(value);

    await depositManager.issue(authorisedHolder, value, getTokens(15), 'ETH', cng1400.address, {from: mainController});

    tokenBalance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(tokenBalance, getTokens(15));

    depositBalance = await getBalance(ethDeposit.address);
    expect(depositBalance).to.equal('0');
  });

  it('should issue token to beneficiary and send stablecoins to wallet', async () => {
    let depositBalance;
    let tokenBalance;

    depositBalance = await daiToken.balanceOf(authorisedHolder);
    expectBignumberEqual(depositBalance, getTokens(500));

    tokenBalance = await cng1400.balanceOf(authorisedHolder);
    expect(tokenBalance.toNumber()).to.equal(0);

    await daiToken.approve(
      stablecoinDeposit.address,
      getTokens(100),
      {from: authorisedHolder}
    );

    await stablecoinDeposit.confirmDeposit(
      authorisedHolder,
      getTokens(100),
      Currencies.DAI
    );

    depositBalance = await daiToken.balanceOf(authorisedHolder);
    expectBignumberEqual(depositBalance, getTokens(400));

    await depositManager.issue(authorisedHolder, getTokens(100), getTokens(15), 'DAI', cng1400.address, {from: mainController});

    tokenBalance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(tokenBalance, getTokens(15));

    depositBalance = await daiToken.balanceOf(ethDeposit.address);
    expectBignumberEqual(depositBalance, getTokens(0));
  });

  it('should revert if it is not called by the controller', async () => {
    await shouldFailWithMessage(
      depositManager.issue(authorisedHolder, getTokens(100), getTokens(15), 'DAI', cng1400.address, {from: issuer}),
      'Only controller role'
    );
  });
});
