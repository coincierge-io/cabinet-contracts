const {shouldFailWithMessage} = require('../../helpers/utils');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {expect} = require('../../../helpers');

contract('cng1400: ctor', accounts => {
  it('should deploy if the tclController address is a contract', async () => {
    await deployAndSetupCng1400(accounts);
  });

  it('should set the ERC20 details correctly', async () => {
    const params = {
      name: 'Controlled Token',
      symbol: 'CTRT',
      decimals: 18
    };
    const {cng1400} = await await deployAndSetupCng1400(accounts, params);
    const name = await cng1400.name();
    const symbol = await cng1400.symbol();

    expect(name).is.equal(params.name);
    expect(symbol).is.equal(params.symbol);
  });
});
