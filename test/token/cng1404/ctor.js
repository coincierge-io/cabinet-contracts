const {expectVMException} = require('../../helpers/utils');
const {deployCng1404} = require('../../helpers/deploy');

contract('CNG1404: ctor', accounts => {
  it('should revert if the whitelist address is not a contract', async () => {
    await expectVMException(
      deployCng1404(
        accounts,
        {
          name: 'name',
          symbol: 'symbol',
          cap: 18,
          whitelistOracle: '0x0'
        }
      )
    );
  });

  it('should deploy if the whitelist address is a contract', async () => {
    await deployCng1404(
      accounts,
      {
        name: 'name',
        symbol: 'symbol',
        cap: 18
      }
    );
  });
});
