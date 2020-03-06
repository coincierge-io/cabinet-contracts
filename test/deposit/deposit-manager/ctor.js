/* eslint-disable no-shadow */
const {expect} = require('../../helpers');
const {
  deployDepositManager
} = require('../../helpers/deploy');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {
  getWalletAddress,
  ZERO_ADDRESS,
  EOA_ADDRESS
} = require('../../helpers/address');

contract('DepositManager: constructor', accounts => {
  let depositManager;
  const mainController = accounts[0];

  beforeEach(async () => {
    ({depositManager} = await deployDepositManager(accounts));
  });

  it('should successfully set the controller to the address passed as controller', async () => {
    const {depositManager} = await deployDepositManager(accounts, {owner: mainController});
    const isController = await depositManager.isController(mainController);

    expect(isController).to.equal(true);
  });

  it('should successfully store the wallet address', async () => {
    const wallet = await depositManager.wallet();

    expect(wallet).to.equal(getWalletAddress(accounts));
  });

  it('should deploy the EthDeposit contract', async () => {
    const ethDeposit = await depositManager.ethDeposit();
    expect(ethDeposit).to.not.equal(undefined);
  });

  it('should deploy the StablecoinDeposit contract', async () => {
    const stablecoinDeposit = await depositManager.stablecoinDeposit();
    expect(stablecoinDeposit).to.not.equal(undefined);
  });

  it('should revert if wallet address is an invalid address', async () => {
    const params = {
      wallet: ZERO_ADDRESS,
      account: mainController
    };

    await shouldFailWithMessage(
      deployDepositManager(accounts, params),
      'Wallet must be a valid address'
    );
  });

  it('should revert if token repository is not a contract address', async () => {
    const params = {
      tokenRepository: {address: EOA_ADDRESS},
      account: mainController
    };

    await shouldFailWithMessage(
      deployDepositManager(accounts, params),
      'Token repository should be a contract address'
    );
  });
});
