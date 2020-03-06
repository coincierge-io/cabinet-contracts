const {expect} = require('../../helpers');
const {deployEthDeposit, Currencies} = require('../../helpers/deploy');
const {
  getContributor,
  getDefaultAddress,
  getWalletAddress
} = require('../../helpers/address');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {toWei, getBalance} = require('../../helpers/utils');
const {findEvent} = require('../../helpers/events');

contract('EthDeposit: release', accounts => {
  let ethDeposit;
  const mainController = accounts[0];

  beforeEach(async () => {
    ethDeposit = await deployEthDeposit(
      accounts,
      {account: mainController}
    );
  });

  it('should transfer the specified amount to the wallet address', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(2, 'ether'),
      from: getContributor(accounts, 1)
    });

    const balanceBefore = await getBalance(getWalletAddress(accounts));

    await ethDeposit.release(
      getContributor(accounts, 1),
      toWei(1, 'ether'),
      Currencies.ETH,
      {from: getDefaultAddress(accounts)}
    );

    const balance = await getBalance(getWalletAddress(accounts));

    expect(Number(balance)).to.equal(
      (Number(balanceBefore) + Number(toWei(1, 'ether')))
    );
  });

  it('should revert if there is not enough balance', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(2, 'ether'),
      from: getContributor(accounts, 1)
    });

    await shouldFailWithMessage(
      ethDeposit.release(
        getContributor(accounts, 1),
        toWei(20, 'ether'),
        Currencies.ETH,
        {from: getDefaultAddress(accounts)}
      ),
      `Cannot release more than the account's balance`
    );
  });

  it('should emit a release event', async () => {
    await ethDeposit.sendTransaction({
      value: toWei(2, 'ether'),
      from: getContributor(accounts, 1)
    });

    const {receipt: {logs}} = await ethDeposit.release(
      getContributor(accounts, 1),
      toWei(1, 'ether'),
      Currencies.ETH,
      {from: getDefaultAddress(accounts)}
    );

    const {args} = await findEvent(logs, 'Release');

    expect(args.beneficiary).to.equal(getContributor(accounts, 1));
    expect(args.value.toString()).to.equal(toWei(1, 'ether'));
    expect(args.currency).to.equal(Currencies.ETH);
  });
});
