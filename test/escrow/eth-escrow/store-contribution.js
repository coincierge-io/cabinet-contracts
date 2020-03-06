const {commonTests} = require('../../helpers/store-contribution')
const {deployEthEscrow, Currencies} = require('../../helpers/deploy')
const {toWei} = require('../../helpers/utils')

contract('EthEscrow: storeContibution', accounts => {
  // Here we're also testing that the storeContribution from the base contract is invoked
  describe('Common', async () => {
    const confirmContribution = async (
      escrow, 
      contributor, 
      value=toWei(1, 'ether')
    ) => {
      return await escrow.sendTransaction({
        value,
        from: contributor
      });
    }

    commonTests(
      accounts,
      deployEthEscrow,
      confirmContribution, 
      Currencies.ETH,
      toWei(1, 'ether')
    );
  })
})
