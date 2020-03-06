const {getTclActors} = require('../../helpers/address');
const {deployMockRestrictedAccess} = require('../../helpers/deploy');
const {getPrivateKeyFromAddress} = require('../../helpers/signatures');
const {getAccessToken} = require('../../../../../js/packages/eth-utils/data/v1/accessControl');
const {getMethodSelectorFromAbi} = require('../../../../../js/packages/eth-utils/contracts/v1/Contract');

contract('AccessControl: nonceExists', accounts => {
  const SYMBOL = 'ERC';
  const nonce = SYMBOL;
  let methodSelector;

  const {mainController, authorisedHolder} = getTclActors(accounts);
  let accessControlledContract;
  let accessToken;

  beforeEach(async () => {
    accessControlledContract = await deployMockRestrictedAccess(accounts);
    methodSelector = getMethodSelectorFromAbi(accessControlledContract.abi, 'doSomething');

    ({accessToken} = getAccessToken({
      method: methodSelector,
      privKey: getPrivateKeyFromAddress(mainController),
      bearer: authorisedHolder,
      nonce,
      restrictedContractAddress: accessControlledContract.address
    }));
  });

  it('should return false for fresh nonces', async () => {
    const exists = await accessControlledContract.nonceExists(nonce);

    expect(exists).to.be.equal(false);
  });

  it('should return true for used nonces', async () => {
    await accessControlledContract
      .doSomething(nonce, accessToken, {from: authorisedHolder});

    const exists = await accessControlledContract.nonceExists(nonce);

    expect(exists).to.be.equal(true);
  });
});
