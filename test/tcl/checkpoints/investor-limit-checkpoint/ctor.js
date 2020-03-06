const {expect} = require('../../helpers');
const {deployInvestorLimitCheckpoint} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');
const {shouldFailWithMessage} = require('../../../helpers/utils');
const {checkpointControler} = require('../../../../../../js/packages/eth-utils/data/v1/checkpoint');

contract('InvestorLimitCheckpoint: ctor', accounts => {
  let investorLimitCheckpoint;
  const mainController = accounts[1];

  beforeEach(async () => {
    investorLimitCheckpoint = await deployInvestorLimitCheckpoint(
      accounts,
      {account: mainController},
      {from: mainController}
    );
  });

  it('should set the correct account as the main controller', async () => {
    const isController = await investorLimitCheckpoint.isController(mainController);
    expect(isController).to.equal(true);
  });

  it('should set the correct controller of value', async () => {
    const controllerOf = await investorLimitCheckpoint.controllerOf();
    expect(controllerOf).to.equal(checkpointControler.investorLimitCheckpoint);
  });
});
