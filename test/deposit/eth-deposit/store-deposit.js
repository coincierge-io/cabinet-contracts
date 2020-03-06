const {commonTests} = require('../../helpers/store-deposit');
const {deployEthDeposit, Currencies} = require('../../helpers/deploy');
const {
  toWei
} = require('../../helpers/utils');

contract('EthDeposit: storeDeposit', accounts => {
  describe('Common', async () => {
    const confirmDeposit = async (
      escrow,
      contributor,
      value = toWei(1, 'ether')
    ) => await escrow.sendTransaction({
      value,
      from: contributor
    });

    commonTests(
      accounts,
      deployEthDeposit,
      confirmDeposit,
      Currencies.ETH,
      toWei(1, 'ether')
    );
  });
});
