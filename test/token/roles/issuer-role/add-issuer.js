const {expect} = require('../../../../../common/test/helpers')
const {deployIssuerRole} = require('../../utils');
const {findEvent} = require('../../../helpers/events');
const {shouldFailWithMessage} = require('../../../../../common/test/helpers/utils');

contract('IssuerRole: addIssuer', accounts => {
  const issuer = accounts[1];
  const newIssuer = accounts[2];
  let issuerRole;

  beforeEach(async () => {
    const params = {
      account: issuer
    }

    issuerRole = await deployIssuerRole(accounts, params);
  })

  it('should add the given account to the list of issuers', async () => {
    await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );

    const isIssuer = await issuerRole.isIssuer(newIssuer);
    expect(isIssuer).to.equal(true);
  })

  it('should emit IssuerAdded event', async () => {
    const {receipt: {logs}} = await issuerRole.addIssuer(
      newIssuer,
      {from: issuer}
    );
    const {args} = findEvent(logs, 'IssuerAdded');

    expect(args.account).to.equal(newIssuer);
  })

  it('should revert if called by someone who doesnt have the issuer Role', async () => {
    // someone without the issuer role trying to add himself
    await shouldFailWithMessage(
      issuerRole.addIssuer(
        newIssuer,
        {from: newIssuer}
      ),
      'Only issuer role'
    )
  })
})
