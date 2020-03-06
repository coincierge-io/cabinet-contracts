const TokenRepository = artifacts.require('TokenRepository')
const {deployStablecoinEscrow, deployCappedMintableToken, Currencies} = require('../../helpers/deploy')
const {getContributor, getNonWhitelistedAdress} = require('../../helpers/address')
const {getTokens} = require('../../helpers/utils')

const deployEscrow = async accounts => {
  const stablecoinEscrow = await deployStablecoinEscrow(accounts);
  const daiToken = await deployCappedMintableToken(accounts);
  const trueUsdToken = await deployCappedMintableToken(accounts);
  
  // mint tokens 
  daiToken.mint(getContributor(accounts, 1), getTokens(500));
  trueUsdToken.mint(getContributor(accounts, 1), getTokens(500));

  // the non whitelisted address
  daiToken.mint(getNonWhitelistedAdress(accounts), getTokens(500));
  
  // register stablecoins
  const tokenRepositoryAddress = await stablecoinEscrow.tokenRepository();
  const tokenRepository = await TokenRepository.at(tokenRepositoryAddress); 
  await tokenRepository.registerToken(Currencies.DAI, daiToken.address);
  await tokenRepository.registerToken(Currencies.TRUE_USD, trueUsdToken.address);

  return [stablecoinEscrow, daiToken, trueUsdToken];
}

module.exports = {deployEscrow}
