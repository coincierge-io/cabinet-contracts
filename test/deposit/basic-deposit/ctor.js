const {expect} = require('../../helpers');
const {deployBasicDeposit} = require('../../helpers/deploy');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {getDefaultAddress, getWalletAddress, ZERO_ADDRESS} = require('../../helpers/address');


contract('BasicDeposit: constructor', accounts => {
  let basicDeposit;
  const mainController = accounts[1];

  beforeEach(async () => {
    basicDeposit = await deployBasicDeposit(
      accounts,
      {account: mainController}
    );
  });

  it('should default the isWithdrawEnabled to false', async () => {
    const isWithdrawEnabled = await basicDeposit.isWithdrawEnabled();

    expect(isWithdrawEnabled).to.equal(false);
  });

  it('should successfully store the owner address', async () => {
    const owner = await basicDeposit.owner();

    expect(owner).to.equal(getDefaultAddress(accounts));
  });

  it('should successfully store the wallet address', async () => {
    const wallet = await basicDeposit.wallet();

    expect(wallet).to.equal(getWalletAddress(accounts));
  });

  it('should revert if wallet address is an invalid address', async () => {
    const params = {
      wallet: ZERO_ADDRESS,
      account: mainController
    };

    await shouldFailWithMessage(
      deployBasicDeposit(accounts, params),
      'Wallet must be a valid address'
    );
  });
});
