const {expectBignumberEqual, expect} = require('../../../../common/test/helpers');
const {shouldFailWithMessage, toHex, hexToBytes, getTokens} = require('../../../../common/test/helpers/utils');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');

contract('erc1594: issue', accounts => {
  let cng1400;
  const {issuer, authorisedHolder, dodgyGuy} = getTclActors(accounts);
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'))

  beforeEach(async () => {
    ({cng1400} = await deployAndSetupCng1400(accounts));
  });

  it('should revert if the receiver is not authorised', async () => {
    await shouldFailWithMessage(
      cng1400.issue(dodgyGuy, getTokens(100), EMPTY_DATA, {from: issuer}),
      'RECIPIENT_BLOCKED'
    );
  });

  it('should revert if the sender is not the issuer', async () => {
    await shouldFailWithMessage(
      cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: dodgyGuy}),
      'Only issuer role.'
    );
  });

  it('should revert if token is no issuable anymore', async () => {
    await cng1400.finishIssuance({from: issuer});
    const isIssuable = await cng1400.isIssuable();

    expect(isIssuable).is.equal(false);
    await shouldFailWithMessage(
      cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer}),
      'Issuance period has ended.'
    );
  });

  it('should mint the correct amount of tokens if the beneficiary is authorised', async () => {
    await cng1400.issue(authorisedHolder, getTokens(15), EMPTY_DATA, {from: issuer});
    const balance = await cng1400.balanceOf(authorisedHolder);

    expectBignumberEqual(balance, getTokens(15));
  });
});
