const TokenVestingFactory = artifacts.require('TokenVestingFactory')
const {expect} = require('../../../../common/test/helpers')
const {deployTokenVestingFactory} = require('../../helpers/deploy')

contract('TokenVestingFactory: ctor', () => {
  let vestingFactory;

  beforeEach(async () => {
    vestingFactory = await deployTokenVestingFactory();
  })
})
