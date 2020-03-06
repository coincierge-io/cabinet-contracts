const {expect} = require('../../helpers');
const {deployControllerRole} = require('../utils');
const {findEvent} = require('../../helpers/events');
const {shouldFailWithMessage} = require('../../helpers/utils');

contract('ControllerRole: renounceController', accounts => {
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

  it('should remove the given account from the controller role', async () => {
    await controllerRole.renounceController({from: newController});

    const isController = await controllerRole.isController(newController);
    expect(isController).to.equal(false);
  });

  it('should emit ControllerRemoved event', async () => {
    const {receipt: {logs}} = await controllerRole.renounceController({from: newController});

    const {args} = findEvent(logs, 'ControllerRemoved');

    expect(args.account).to.equal(newController);
    expect(args.controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should revert if owner tries renounce himself', async () => {
    await shouldFailWithMessage(
      controllerRole.renounceController({from: mainController}),
      'Owner cannot renounce himself'
    );
  });
});
