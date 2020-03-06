const {expect} = require('../../../../common/test/helpers');
const {deployControllerRole} = require('../utils');
const {findEvent} = require('../../helpers/events');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');

contract('ControllerRole: addController', accounts => {
  const mainController = accounts[1];
  const newController = accounts[2];
  let controllerRole;

  beforeEach(async () => {
    const params = {
      account: mainController,
      controllerOf: 'TCL_CONTROLLER'
    };

    controllerRole = await deployControllerRole(accounts, params);
  });

  it('should add the given account to the list of controller', async () => {
    await controllerRole.addController(
      newController,
      {from: mainController}
    );

    const isController = await controllerRole.isController(newController);
    expect(isController).to.equal(true);
  });

  it('should emit ControllerAdded event', async () => {
    const {receipt: {logs}} = await controllerRole.addController(
      newController,
      {from: mainController}
    );
    const {args} = findEvent(logs, 'ControllerAdded');

    expect(args.account).to.equal(newController);
    expect(args.controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should revert if called by someone who does not have the Controller Role', async () => {
    // someone without the controller role trying to add himself
    await shouldFailWithMessage(
      controllerRole.addController(
        newController,
        {from: newController}
      ),
      'Only controller role'
    );
  });
});
