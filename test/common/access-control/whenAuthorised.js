const {shouldFailWithMessage} = require('../../helpers/utils');
const {getTclActors} = require('../../helpers/address');
const {getAccessToken} = require('../../../../../js/packages/eth-utils/data/v1/accessControl');
const {deployMockRestrictedAccess} = require('../../helpers/deploy');
const {getPrivateKeyFromAddress} = require('../../helpers/signatures');
const {getMethodSelectorFromAbi} = require('../../../../../js/packages/eth-utils/contracts/v1/Contract');


contract('AccessControl: _whenAuthorised', accounts => {
  const SYMBOL = 'ERC';
  const nonce = SYMBOL;
  let methodSelector;

  const {mainController, authorisedHolder, dodgyGuy} = getTclActors(accounts);
  let accessControlledContract;
  let accessToken;

  beforeEach(async () => {
    accessControlledContract = await deployMockRestrictedAccess(accounts);
    methodSelector = getMethodSelectorFromAbi(accessControlledContract.abi, 'doSomething');

    ({accessToken} = getAccessToken({
      privKey: getPrivateKeyFromAddress(mainController),
      method: methodSelector,
      bearer: authorisedHolder,
      nonce,
      restrictedContractAddress: accessControlledContract.address
    }));
  });

  it('should allow authorised users', async () => {
    await accessControlledContract
      .doSomething(nonce, accessToken, {from: authorisedHolder});
  });

  it('should not allow impersonated users', async () => {
    await shouldFailWithMessage(
      accessControlledContract
        .doSomething(nonce, accessToken, {from: dodgyGuy}),
      'Invalid Access Token'
    );
  });

  it('should not allow same nonce twice', async () => {
    await accessControlledContract
      .doSomething(nonce, accessToken, {from: authorisedHolder});

    await shouldFailWithMessage(
      accessControlledContract
        .doSomething(nonce, accessToken, {from: authorisedHolder}),
      'Nonce already used'
    );
  });

  it('should not allow non-signer roles to create access token', async () => {
    const {accessToken: invalidAccessToken} = getAccessToken({
      privKey: getPrivateKeyFromAddress(authorisedHolder),
      method: methodSelector,
      bearer: authorisedHolder,
      nonce,
      restrictedContractAddress: accessControlledContract.address
    });

    await shouldFailWithMessage(
      accessControlledContract
        .doSomething(nonce, invalidAccessToken, {from: authorisedHolder}),
      'Invalid Access Token'
    );
  });
});
