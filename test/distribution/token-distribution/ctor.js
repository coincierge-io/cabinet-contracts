const TokenDistribution = artifacts.require('TokenDistribution')
const Token = artifacts.require('ERC20')
const {expect} = require('../../../../common/test/helpers')
const {EOA_ADDRESS} = require('../../../../common/test/helpers/address')
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils')

contract('TokenDistribution: ctor', accounts => {
  it('should revert if the token address is not a contract', async () => {
    await shouldFailWithMessage(
      TokenDistribution.new(EOA_ADDRESS),
      'Token should be a contract address'
    );
  })  

  it('should save the erc20 address upon sucessful deployment', async () => {
    const token = await Token.new();
    const tokenDistribution = await TokenDistribution.new(token.address);
    const tokenInstance = await tokenDistribution.token.call();

    expect(token.address).to.equal(tokenInstance)
  })
})
