const {shouldFailWithMessage} = require('../../helpers/utils');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {expect} = require('../../../helpers');

contract('erc1594: ctor', accounts => {
  it('should revert if the tclController address is not a contract', async () => {
    await shouldFailWithMessage(
      deployAndSetupCng1400(accounts, {tclController: {address: accounts[0]}}),
      'TclController should be a contract address'
    );
  });


  it('should deploy if the tclController address is a contract', async () => {
    await deployAndSetupCng1400(accounts);
  });

  it('should set the tclController correctly', async () => {
    const {cng1400, tclController} = await deployAndSetupCng1400(accounts);
    const storedTclController = await cng1400.tclController();

    expect(storedTclController).is.equal(tclController.address);
  });

  it('should set isIssuable to true by default', async () => {
    const {cng1400} = await deployAndSetupCng1400(accounts);
    const isIssuable = await cng1400.isIssuable();
    expect(isIssuable).is.equal(true);
  });

  it('should set isControllable to false by default', async () => {
    const {cng1400} = await deployAndSetupCng1400(accounts);
    const isControllable = await cng1400.isControllable();
    expect(isControllable).is.equal(false);
  });
});
