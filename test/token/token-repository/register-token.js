const {deployTokenRepository, deployCappedMintableToken,  Currencies} = require('../../helpers/deploy')
const {expect} = require('../../../../common/test/helpers')
const {EOA_ADDRESS} = require('../../../../common/test/helpers/address')
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils')

contract('TokenRepository: registerToken', accounts => {
  let tokenRepository;
  let erc20;

  beforeEach(async () => {
    tokenRepository = await deployTokenRepository(accounts);
    erc20 = await deployCappedMintableToken(accounts);
  })

  it('should register a new token address', async () => {
    await tokenRepository.registerToken(Currencies.DAI, erc20.address);
    const tokenAddress = await tokenRepository.getTokenAddress(Currencies.DAI);

    expect(tokenAddress).to.be.equal(erc20.address);
  })

  it('should store the token name in the tokenList', async () => {
    await tokenRepository.registerToken(Currencies.DAI, erc20.address);
    await tokenRepository.registerToken(Currencies.TRUE_USD, erc20.address);

    const dai = await tokenRepository.tokenList(0);
    const trueUsd = await tokenRepository.tokenList(1);

    expect(dai).to.be.equal(Currencies.DAI);
    expect(trueUsd).to.be.equal(Currencies.TRUE_USD);
  })

  it('should revert if token address has already been register', async () => {
    await tokenRepository.registerToken(Currencies.DAI, erc20.address);

    await shouldFailWithMessage(
      tokenRepository.registerToken(Currencies.DAI, erc20.address),
      'Cannot override the address of a previously added currency'
    )
  })

  it('should revert if the token address is not a contract address', async () => {
    await shouldFailWithMessage(
      tokenRepository.registerToken(Currencies.DAI, EOA_ADDRESS),
      'erc20 should be a contract address'
    )
  })
})
