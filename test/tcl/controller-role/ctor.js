const {expect} = require('../../helpers');
const {deployControllerRole} = require('../utils');
const {ZERO_ADDRESS} = require('../../helpers/address');
const {shouldFailWithMessage} = require('../../helpers/utils');

contract('ControllerRole: ctor', accounts => {
  let controllerRole;

  const params = {
    account: accounts[1],
    controllerOf: 'TCL_CONTROLLER'
  };

  beforeEach(async () => {
    controllerRole = await deployControllerRole(accounts, params);
  });

  it('should set the type of the controller', async () => {
    const controllerOf = await controllerRole.controllerOf();
    expect(controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should add the given account into the list of controllers', async () => {
    const isController = await controllerRole.isController(accounts[1]);
    expect(isController).to.equal(true);
  });

  it('should transfer the ownership to the given account', async () => {
    const owner = await controllerRole.owner();
    expect(owner).to.equal(accounts[1]);
  });

  it('should emit ControllerAdded event in constructor', async () => {
    const contract = await deployControllerRole(accounts, params);
    const controllerAddedEvent = await contract.getPastEvents('ControllerAdded');

    expect(controllerAddedEvent[0].transactionHash).to.equal(contract.transactionHash);
    expect(controllerAddedEvent[0].args.account).to.equal(params.account);
    expect(controllerAddedEvent[0].args.controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should revert if the account is an zero address', async () => {
    await shouldFailWithMessage(
      deployControllerRole(accounts, {...params, account: ZERO_ADDRESS}),
      'Main controller should be a valid address'
    );
  });
});
