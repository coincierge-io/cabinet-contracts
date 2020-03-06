const {getTclActors} = require('../../helpers/address');
const {deployAccessControl} = require('../../helpers/deploy');
const {getAccessToken} = require('../../../../../js/packages/eth-utils/data/v1/accessControl');
const {getMethodSelectorFromAbi} = require('../../../../../js/packages/eth-utils/contracts/v1/Contract');
const {getPrivateKeyFromAddress} = require('../../helpers/signatures');


contract('AccessControl: getPayload', accounts => {
  const SYMBOL = 'ERC';
  const nonce = SYMBOL;

  const {authorisedHolder, mainController} = getTclActors(accounts);
  let accessControlInstance;
  let ethSignedMessage;
  let methodSelector;

  beforeEach(async () => {
    accessControlInstance = await deployAccessControl(accounts);
    methodSelector = getMethodSelectorFromAbi(accessControlInstance.abi, 'getPayload');

    ({ethSignedMessage} = getAccessToken({
      privKey: getPrivateKeyFromAddress(mainController),
      bearer: authorisedHolder,
      method: methodSelector,
      nonce,
      restrictedContractAddress: accessControlInstance.address
    }));
  });

  it('should return the correct ETH-hash given the nonce', async () => {
    const hash = await accessControlInstance
      .getPayload(
        methodSelector,
        nonce,
        {from: authorisedHolder}
      );

    expect(hash).to.be.equal(ethSignedMessage);
  });
});
