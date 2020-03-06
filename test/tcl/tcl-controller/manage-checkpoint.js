const {expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');
const {
  deployCountryLimitCheckpoint, 
  deployTclRepository,
  deployTclController
} = require('../utils');
const {toHex, hexToBytes} = require('../../../../common/test/helpers/utils');
const {deployClaimRegistry} = require('../../identity/utils');

contract('TclController: manageCheckpoint', accounts => {
  let tclController;
  let countryLimitCheckpoint;
  let claimRegistry;

  const mainController = accounts[1];

  beforeEach(async () => {
    const tclRepository = await deployTclRepository(accounts, {
			account: mainController
		});

		const params = {
			tclRepository: tclRepository.address,
			account: mainController
    };

    tclController = await deployTclController(accounts, params);

    claimRegistry = await deployClaimRegistry(accounts, {account: mainController});
    countryLimitCheckpoint = await deployCountryLimitCheckpoint(
      accounts,
      {account: tclController.address, claimRegistry: claimRegistry.address},
      {from: mainController}
    );
  });

  it('should allow the tcl controller to call the checkpoint function', async () => {
    const callData = countryLimitCheckpoint.contract
      .methods
      .addLimits(
        [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
        [10, 20, 30]
      )
      .encodeABI()

    await tclController.manageCheckpoint(
      countryLimitCheckpoint.address, 
      callData, 
      {from: mainController}
    );

    const grcLimit = await countryLimitCheckpoint.getLimit(hexToBytes(toHex('GRC')));
    const gbrLimit = await countryLimitCheckpoint.getLimit(hexToBytes(toHex('GBR')));
    const usaLimit = await countryLimitCheckpoint.getLimit(hexToBytes(toHex('USA')));

    expect(grcLimit.toNumber()).to.equal(10);
    expect(gbrLimit.toNumber()).to.equal(20);
    expect(usaLimit.toNumber()).to.equal(30);
  });

  it('should revert if the destination method fails', async () => {
    // this will cause the add limits to fail as the tclController is not a controller
    // so it cannot invoke this method
    countryLimitCheckpoint = await deployCountryLimitCheckpoint(
      accounts,
      {account: mainController, claimRegistry: claimRegistry.address},
      {from: mainController}
    );

    const callData = countryLimitCheckpoint.contract
      .methods
      .addLimits(
        [hexToBytes(toHex('GRC')), hexToBytes(toHex('GBR')), hexToBytes(toHex('USA'))],
        [10, 20, 30]
      )
      .encodeABI()

    await shouldFailWithMessage(
      tclController.manageCheckpoint(
        countryLimitCheckpoint.address, 
        callData, 
        {from: mainController}
      ),
      'Manage checkpoint action failed'
    )
  });
});
