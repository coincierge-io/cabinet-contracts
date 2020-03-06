const {expectBignumberEqual} = require('../../../helpers');
const {expectVMException} = require('../../helpers/utils');
const {getContributor} = require('../../helpers/address');
const {
  VALID_SIGNATURE_NONCE_0,
  INVALID_SIGNATURE,
  NONCE_0,
  MESSAGE
} = require('../../helpers/signatures');
const {deployCng1404} = require('../../helpers/deploy');

contract('CNG1404: mint', accounts => {
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
  });

  it('should revert if the beneficiary is not whitelisted', async () => {
    await expectVMException(
      cng1404Instance.mint(
        getContributor(accounts, 4),
        100,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should mint the correct amount of tokens if the beneficiary is whitelisted', async () => {
    await cng1404Instance.mint(
      getContributor(accounts, 1),
      15,
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      MESSAGE
    );
    const balance = await cng1404Instance.balanceOf(getContributor(accounts, 1));
    expectBignumberEqual(balance, 15);
  });

  it('should revert if the same nonce is used twice', async () => {
    await cng1404Instance.mint(
      getContributor(accounts, 1),
      15,
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      MESSAGE
    );

    await expectVMException(
      cng1404Instance.mint(
        getContributor(accounts, 1),
        15,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should revert if the signature is invalid', async () => {
    await expectVMException(
      cng1404Instance.mint(
        getContributor(accounts, 1),
        15,
        INVALID_SIGNATURE,
        NONCE_0,
        MESSAGE
      )
    );
  });

  it('should revert if the the message does not match the message used for the signature', async () => {
    await expectVMException(
      cng1404Instance.mint(
        getContributor(accounts, 1),
        15,
        VALID_SIGNATURE_NONCE_0,
        NONCE_0,
        'MESSAGE'
      )
    );
  });
});
