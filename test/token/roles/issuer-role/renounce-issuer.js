const {expect} = require('../../../../../common/test/helpers')
const {deployIssuerRole} = require('../../utils');
const {findEvent} = require('../../../helpers/events');
const {shouldFailWithMessage} = require('../../../../../common/test/helpers/utils');

contract('IssuerRole: renounceIssuer', accounts => {
  const issuer = accounts[1];
  const newIssuer = accounts[2]
  let issuerRole;

  beforeEach(async () => {
    const params = {
      account: issuer
    }

    issuerRole = await deployIssuerRole(accounts, params);

    await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );
  })

  it('should remove the given account from the issuer role', async () => {
    await issuerRole.renounceIssuer({from: newIssuer});

    const isIssuer = await issuerRole.isIssuer(newIssuer);
    expect(isIssuer).to.equal(false);
  })

  it('should emit IssuerRemoved event', async () => {
    const {receipt: {logs}} = await issuerRole.renounceIssuer({from: newIssuer});
    const {args} = findEvent(logs, 'IssuerRemoved');

    expect(args.account).to.equal(newIssuer);
  })

  it('should revert if owner tries renounce himself', async () => {
    await shouldFailWithMessage(
      issuerRole.renounceIssuer({from: issuer}),
      'Owner cannot renounce himself'
    )
  })
})
