const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const {compareAddress} = require('../../../../js/packages/eth-utils/data/v1/address');
const {mnemonic} = require('../../../reference/mnemonics');

const VALID_SIGNATURE_NONCE_0 = '0x14b4b86d5eb6ee645c9f0ae254ffe975983730e35f796a50a9a135e1d72f06b46d9aa07e8ce49005f124e42251cb12341e8d513b146a5b53c46c4c7538231ba91c';
const VALID_SIGNATURE_NONCE_1 = '0x68dd5af6e85e886a83a6b965f1cfcbc363377b836f2870cf2c4c8699053b972c3d39cd07360962186cb310af26936102e2a0fd72e4a646316616403903d2b3ea1b';
const VALID_SIGNATURE_NONCE_1_ACCOUNT_2 = '0x555aabe922c6c4c411944859339b61a4e03d0cf8c24477bf042dfd734686b6654398a95b0a3b196a114a217465f25b24a5714a279d67f7b2a1a37c23859c08191c';
const VALID_SIGNATURE_NONCE_0_WRONG_ACCOUNT = '0x34071ca1e8bf8d497715ddbcddb0e4993ea42ae6e0766d4beb3e8b8ac1d33b0e1d6aba72dbbf123d30c485284aaf469629f4d540fb92f6b4fae18a3b083b06dd1b';
const INVALID_SIGNATURE = '0x34071ca1e8bf8d497715ddbcddb0e4993ea42ae6e0766d4beb3e8b8ac1d33b0e1d6aba72dbbf123d30c485284aaf469629f4d540fb92f6b4fae18a3b083b06dd1b';
const NONCE_0 = '0x0000000000000000';
const NONCE_1 = '0x1111111111111111';
const MESSAGE = 'distribution';

const getPrivateKeyFromAddress = address => {
  const seed = bip39.mnemonicToSeedSync(mnemonic); // mnemonic is the string containing the words
  const hdk = hdkey.fromMasterSeed(seed);

  for (let i = 0; i < 15; i++) {
    const hdAddress = hdk.derivePath(`m/44'/60'/0'/0/${i}`);
    const addr = hdAddress.getWallet().getAddressString();

    if (compareAddress(addr, address)) {
      const privateKey = hdAddress.getWallet().getPrivateKey();
      return `0x${privateKey.toString('hex')}`;
    }
  }

  throw Error(`Priv key for ${address} not found.`);
};

module.exports = {
  getPrivateKeyFromAddress,
  VALID_SIGNATURE_NONCE_0,
  VALID_SIGNATURE_NONCE_1,
  VALID_SIGNATURE_NONCE_0_WRONG_ACCOUNT,
  INVALID_SIGNATURE,
  NONCE_0,
  NONCE_1,
  VALID_SIGNATURE_NONCE_1_ACCOUNT_2,
  MESSAGE
};
