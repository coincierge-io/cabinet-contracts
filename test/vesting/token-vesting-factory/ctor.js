const TokenVestingFactory = artifacts.require('TokenVestingFactory')
const {expect} = require('../../helpers')
const {deployTokenVestingFactory} = require('../../helpers/deploy')

contract('TokenVestingFactory: ctor', () => {
  let vestingFactory;

  beforeEach(async () => {
    vestingFactory = await deployTokenVestingFactory();
  })
})
