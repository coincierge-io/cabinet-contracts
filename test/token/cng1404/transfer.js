const {expectBignumberEqual} = require('../../../helpers');
const {expectVMException} = require('../../helpers/utils');
const {getContributor} = require('../../helpers/address');
const {
  VALID_SIGNATURE_NONCE_0,
  NONCE_0,
  MESSAGE
} = require('../../helpers/signatures');
const {deployCng1404} = require('../../helpers/deploy');

contract('CNG1404: transfer', accounts => {
  let cng1404Instance;

  beforeEach(async () => {
    cng1404Instance = await deployCng1404(
      accounts,
      {
        name: 'name',
        symbol: 'symbol',
        cap: 10000
      }
    );
    await cng1404Instance.mint(
      getContributor(accounts, 1),
      200,
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      MESSAGE
    );
  });

  it('should revert if the beneficiary is not whitelisted', async () => {
    await expectVMException(
      cng1404Instance.transfer(
        getContributor(accounts, 4),
        100,
        {from: getContributor(accounts, 1)}
      )
    );
  });

  it('should transfer to a whitelisted address', async () => {
    await cng1404Instance.transfer(
      getContributor(accounts, 2),
      100,
      {from: getContributor(accounts, 1)}
    );
    const balance = await cng1404Instance.balanceOf(getContributor(accounts, 2));
    expectBignumberEqual(balance, 100);
  });
});
