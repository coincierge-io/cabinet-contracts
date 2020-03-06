const {expectBignumberEqual, expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, toHex, hexToBytes} = require('../../../../common/test/helpers/utils');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');

contract('erc1644: controllerTransfer', accounts => {
  let cng1400;
  let blockedAccountCheckpoint;

  const {
    issuer,
    authorisedHolder,
    dodgyGuy,
    mainController
  } = getTclActors(accounts);
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));

  beforeEach(async () => {
    ({cng1400, blockedAccountCheckpoint} = await deployAndSetupCng1400(accounts));
  });

  it('should revert if token is not controllable', async () => {
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    const canTransferFrom = await cng1400.canTransferFrom(
      authorisedHolder,
      issuer,
      100,
      EMPTY_DATA,
      {from: authorisedHolder}
    );
    expect(canTransferFrom[0]).to.equal(true);

    await shouldFailWithMessage(
      cng1400.controllerTransfer(
        authorisedHolder,
        issuer,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: mainController}
      ),
      'Token is not controllable'
    );
  });

  it('should revert if reissuance receiver is not authorised', async () => {
    await cng1400.setIsControllable(true, {from: issuer});
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    const canTransferFrom = await cng1400.canTransferFrom(
      authorisedHolder,
      dodgyGuy,
      100,
      EMPTY_DATA,
      {from: authorisedHolder}
    );
    expect(canTransferFrom[0]).to.equal(false);

    await shouldFailWithMessage(
      cng1400.controllerTransfer(
        authorisedHolder,
        dodgyGuy,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: mainController}
      ),
      'RECIPIENT_BLOCKED'
    );
  });

  it('should revert if reissuance original owner is not authorised anymore', async () => {
    await cng1400.setIsControllable(true, {from: issuer});

    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    await blockedAccountCheckpoint.blockAccount(authorisedHolder, {from: mainController});

    const canTransferFrom = await cng1400.canTransferFrom(
      authorisedHolder,
      issuer,
      100,
      EMPTY_DATA,
      {from: authorisedHolder}
    );
    expect(canTransferFrom[0]).to.equal(false);

    await shouldFailWithMessage(
      cng1400.controllerTransfer(
        authorisedHolder,
        issuer,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: mainController}
      ),
      'SENDER_BLOCKED'
    );
  });

  it('should revert if the sender is not controller', async () => {
    await cng1400.setIsControllable(true, {from: issuer});

    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    await shouldFailWithMessage(
      cng1400.controllerTransfer(
        authorisedHolder,
        issuer,
        100,
        EMPTY_DATA,
        EMPTY_DATA,
        {from: issuer}
      ),
      'Only controller role.'
    );
  });

  it('should transfer tokens correctly', async () => {
    await cng1400.setIsControllable(true, {from: issuer});

    let balance;
    await cng1400.issue(authorisedHolder, 100, EMPTY_DATA, {from: issuer});

    balance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(balance, 100);

    balance = await cng1400.balanceOf(issuer);
    expectBignumberEqual(balance, 0);

    await cng1400.controllerTransfer(
      authorisedHolder,
      issuer,
      100,
      EMPTY_DATA,
      EMPTY_DATA,
      {from: mainController}
    );

    balance = await cng1400.balanceOf(issuer);
    expectBignumberEqual(balance, 100);
  });
});
