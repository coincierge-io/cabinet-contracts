const {expect} = require('../../../../../common/test/helpers');
const {deployIssuerRole} = require('../../utils');
const {findEvent} = require('../../../helpers/events');
const {expectVMException} = require('../../../../../common/test/helpers/utils');

contract('IssuerRole: removeIssuer', accounts => {
  const issuer = accounts[1];
  const newIssuer = accounts[2];
  let issuerRole;

  beforeEach(async () => {
    const params = {
      account: issuer
    };

    issuerRole = await deployIssuerRole(accounts, params);
  });

  it('should remove the given account from the list of issuers', async () => {
    let isIssuer;

    await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );

    isIssuer = await issuerRole.isIssuer(newIssuer);
    expect(isIssuer).to.equal(true);

    await issuerRole.removeIssuer(
      newIssuer,
      {from: issuer}
    );

    isIssuer = await issuerRole.isIssuer(newIssuer);
    expect(isIssuer).to.equal(false);
  });

  it('should emit IssuerRemoved event', async () => {
    await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );

    const {receipt: {logs}} = await issuerRole.removeIssuer(
      newIssuer,
      {from: issuer}
    );

    const {args} = findEvent(logs, 'IssuerRemoved');
    expect(args.account).to.equal(newIssuer);
  });

  it('should revert if called by someone who doesnt have the Owner', async () => {
    await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );

    await expectVMException(
      issuerRole.removeIssuer(
        newIssuer,
        {from: newIssuer}
      )
    );
  });
});
