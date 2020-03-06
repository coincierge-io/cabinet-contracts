const {expectBignumberEqual} = require('../../../helpers');
const {shouldFailWithMessage, toHex, hexToBytes} = require('../../helpers/utils');
const {getTclActors} = require('../../helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');

contract('erc1644: controllerRedeem', accounts => {
  let cng1400;

  const {
    issuer,
    authorisedHolder,
    mainController
  } = getTclActors(accounts);
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

  beforeEach(async () => {
    ({cng1400} = await deployAndSetupCng1400(accounts));
  });

  it('should revert if token is not controllable', async () => {
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    await shouldFailWithMessage(
      cng1400.controllerRedeem(
        authorisedHolder,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: mainController}
      ),
      'Token is not controllable.'
    );
  });

  it('should revert if the msg.sender is not controller', async () => {
    await cng1400.setIsControllable(true, {from: issuer});
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    await shouldFailWithMessage(
      cng1400.controllerRedeem(
        authorisedHolder,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: issuer}
      ),
      'Only controller role.'
    );
  });

  it('should force redeem tokens correctly', async () => {
    await cng1400.setIsControllable(true, {from: issuer});

    let balance;
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    balance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(balance, 100);

    balance = await cng1400.balanceOf(issuer);
    expectBignumberEqual(balance, 0);

    await cng1400.controllerRedeem(
      authorisedHolder,
      100,
      EMPTY_DATA,
      EMPTY_DATA,
      {from: mainController}
    );

    balance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(balance, 0);
  });
});
