const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const {mnemonic, mainnetMnemonic} = require('./mnemonics');

const web3 = new Web3();

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gasPrice: web3.utils.toWei('11', 'gwei'),
      gas: 8000000, // <-- This is the limit on the mainnet
      network_id: '*' // Match any network id,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 1      // <-- Use this low gas price
    },
    kovan: {
      provider: () => new HDWalletProvider(mnemonic, 'https://kovan.infura.io/v3/3269c013c5b2449aaea1bb593f873d77', 0, 9),
      network_id: 42,
      gas: 7638796,
      gasPrice: web3.utils.toWei('11', 'gwei'),
      skipDryRun: true
    },
    mainnet: {
      provider: () => new HDWalletProvider(mainnetMnemonic, 'https://mainnet.infura.io/v3/3269c013c5b2449aaea1bb593f873d77', 0, 9),
      network_id: 1,
      gas: 4600000,
      gasPrice: web3.utils.toWei('12', 'gwei'),
      skipDryRun: true
    }
  },

  compilers: {
    solc: {
      version: '0.5.7',
      settings: {
        optimizer: {
          enabled: true,
          runs: 1337
        }
      }
    }
  },

  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'GBP',
      gasPrice: 11
    }
  }
};
