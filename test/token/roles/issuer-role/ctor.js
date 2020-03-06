const {expect} = require('../../../../helpers');
const {deployIssuerRole} = require('../../utils');
const {ZERO_ADDRESS} = require('../../../helpers/address');
const {shouldFailWithMessage} = require('../../../helpers/utils');

contract('IssuerRole: ctor', accounts => {
  let issuerRole;
  const params = {
    account: accounts[1]
  };

  beforeEach(async () => {
    issuerRole = await deployIssuerRole(accounts, params);
  });

  it('should add the given account into the list of controllers', async () => {
    const isIssuer = await issuerRole.isIssuer(accounts[1]);
    expect(isIssuer).to.equal(true);
  });

  it('should emit IssuerAdded event in constructor', async () => {
    const contract = await deployIssuerRole(accounts, params);
    const issuerAddedEvent = await contract.getPastEvents('IssuerAdded');

    expect(issuerAddedEvent[0].transactionHash).to.equal(contract.transactionHash);
    expect(issuerAddedEvent[0].args.account).to.equal(params.account);
  });

  it('should transfer the ownership to the given account', async () => {
    const owner = await issuerRole.owner();
    expect(owner).to.equal(accounts[1]);
  });

  it('should revert if the account is an zero address', async () => {
    const params = {
      account: ZERO_ADDRESS
    };

    await shouldFailWithMessage(
      deployIssuerRole(accounts, params),
      'Issuer should be a valid address'
    );
  });
});
