const {expect} = require('../../../../common/test/helpers');
const {deployControllerRole} = require('../utils');
const {findEvent} = require('../../helpers/events');
const {expectVMException} = require('../../../../common/test/helpers/utils');

contract('ControllerRole: removeController', accounts => {
  const mainController = accounts[1];
  const newController = accounts[2];
  let controllerRole;

  beforeEach(async () => {
    const params = {
      account: mainController,
      controllerOf: 'TCL_CONTROLLER'
    };

    controllerRole = await deployControllerRole(accounts, params);

    await controllerRole.addController(
      newController,
      {from: mainController}
    );
  });

  it('should remove the given account from the list of controllers', async () => {
    let isController;
    isController = await controllerRole.isController(newController);
    expect(isController).to.equal(true);

    await controllerRole.removeController(newController, {from: mainController});

    isController = await controllerRole.isController(newController);
    expect(isController).to.equal(false);
  });

  it('should emit ControllerRemoved event', async () => {
    const {
      receipt: {logs}
    } = await controllerRole.removeController(newController, {from: mainController});

    const {args} = findEvent(logs, 'ControllerRemoved');

    expect(args.account).to.equal(newController);
    expect(args.controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should revert if msg.sender is not Owner', async () => {
    const isController = await controllerRole.isController(newController);
    expect(isController).to.equal(true);

    await expectVMException(
      controllerRole.removeController(newController, {from: newController})
    );
  });
});
