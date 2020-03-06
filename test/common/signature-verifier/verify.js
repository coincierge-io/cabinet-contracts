const {expectVMException} = require('../../helpers/utils');
const {
  VALID_SIGNATURE_NONCE_0,
  INVALID_SIGNATURE,
  VALID_SIGNATURE_NONCE_0_WRONG_ACCOUNT,
  NONCE_0,
  NONCE_1,
  VALID_SIGNATURE_NONCE_1_ACCOUNT_2
} = require('../../helpers/signatures');
const {
  getTeamFundAddress
} = require('../../helpers/address');
const {deploySignatureverifier} = require('../../helpers/deploy');

contract('SignatureVerifier: verify', accounts => {
  let verifierInstance;
  const message = 'distribution';

  beforeEach(async () => {
    verifierInstance = await deploySignatureverifier(accounts);
  });

  it('should return true if the signature is valid', async () => {
    const result = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      message
    );

    expect(result).to.be.equal(true);
  });

  it('should accept signatures from all signers', async () => {
    const result1 = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      message
    );

    await verifierInstance.addSigner(getTeamFundAddress(accounts));

    const result2 = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_1_ACCOUNT_2,
      NONCE_1,
      message
    );
    expect(result1).to.be.equal(true);
    expect(result2).to.be.equal(true);
  });

  it('should return false if the signature is invalid', async () => {
    const result1 = await verifierInstance.verifySignature(
      INVALID_SIGNATURE,
      NONCE_0,
      message
    );
    expect(result1).to.be.equal(false);
  });

  it('should return false if the nonce is different than the one in the signature', async () => {
    const result1 = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_1,
      message
    );
    expect(result1).to.be.equal(false);
  });

  it('should return false if the message is different than the one in the signature', async () => {
    const result1 = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_0,
      NONCE_0,
      'message'
    );
    expect(result1).to.be.equal(false);
  });

  it('should return false if the data were signed by a non signer address', async () => {
    const result1 = await verifierInstance.verifySignature(
      VALID_SIGNATURE_NONCE_0_WRONG_ACCOUNT,
      NONCE_0,
      message
    );
    expect(result1).to.be.equal(false);
  });
});
