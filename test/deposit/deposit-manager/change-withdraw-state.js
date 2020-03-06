const EthDeposit = artifacts.require('EthDeposit');
const StablecoinDeposit = artifacts.require('StablecoinDeposit');
const {expect} = require('../../helpers');
const {deployDepositManager} = require('../../helpers/deploy');

contract('DepositManager: changeWithdrawState', accounts => {
  let depositManager;
  let ethDeposit;
  let stablecoinDeposit;

  beforeEach(async () => {
    ({depositManager} = await deployDepositManager(accounts));

    const ethDepositAddress = await depositManager.ethDeposit();
    ethDeposit = await EthDeposit.at(ethDepositAddress);

    const stablecoinDepositAddress = await depositManager.stablecoinDeposit();
    stablecoinDeposit = await StablecoinDeposit.at(stablecoinDepositAddress);
  });

  it('should call the ethDeposit changeWithdrawState function', async () => {
    await depositManager.changeWithdrawState(true);

    const isWithdrawEnabled = await ethDeposit.isWithdrawEnabled();

    expect(isWithdrawEnabled).to.be.true;
  });

  it('should call the stablecoinDeposit changeWithdrawState function', async () => {
    await depositManager.changeWithdrawState(true);

    const isWithdrawEnabled = await stablecoinDeposit.isWithdrawEnabled();

    expect(isWithdrawEnabled).to.be.true;
  });
});
