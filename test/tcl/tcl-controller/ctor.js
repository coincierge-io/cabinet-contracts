const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../helpers/utils');
const {
  deployTclRepository,
  deployTclController,
  getDefaultExecutionPlan
} = require('../utils');

contract('TclController: ctor', accounts => {
  let tclRepository;
  let tclController;

  const mainController = accounts[1];

  beforeEach(async () => {
    tclRepository = await deployTclRepository(
      accounts,
      {account: mainController}
    );

    const params = {
      tclRepository: tclRepository.address,
      account: mainController
    };

    tclController = await deployTclController(accounts, params);
  });

  it('should store the address of the transfer checkpoint repository', async () => {
    const storedTclRepository = await tclController.getTclRepository();
    expect(storedTclRepository).to.equal(tclRepository.address);
  });

  it('should set the correct account as the main controller', async () => {
    const isController = await tclController.isController(mainController);
    expect(isController).to.equal(true);
  });

  it('should set the correct controller of value', async () => {
    const controllerOf = await tclController.controllerOf();
    expect(controllerOf).to.equal('TCL_CONTROLLER');
  });

  it('should revert if transfer checkpoint repository is not a contract address', async () => {
    const params = {
      tclRepository: accounts[5],
      account: mainController,
      executionPlan: getDefaultExecutionPlan()
    };

    await shouldFailWithMessage(
      deployTclController(accounts, params),
      'Checkpoint repository should be a contract address'
    );
  });
});
