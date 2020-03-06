const TokenRepository = artifacts.require('TokenRepository');
const {
  deployStablecoinDeposit,
  deployCappedMintableToken,
  Currencies
} = require('../../helpers/deploy');
const {getContributor, getNonWhitelistedAdress} = require('../../../../common/test/helpers/address');
const {getTokens} = require('../../../../common/test/helpers/utils');

const deployDeposit = async accounts => {
  const mainController = accounts[0];

  const stablecoinDeposit = await deployStablecoinDeposit(
    accounts,
    {account: mainController}
  );
  const daiToken = await deployCappedMintableToken(accounts);
  const trueUsdToken = await deployCappedMintableToken(accounts);

  // mint tokens
  daiToken.mint(getContributor(accounts, 1), getTokens(500));
  trueUsdToken.mint(getContributor(accounts, 1), getTokens(500));

  // the non whitelisted address
  daiToken.mint(getNonWhitelistedAdress(accounts), getTokens(500));

  // register stablecoins
  const tokenRepositoryAddress = await stablecoinDeposit.tokenRepository();
  const tokenRepository = await TokenRepository.at(tokenRepositoryAddress);
  await tokenRepository.registerToken(Currencies.DAI, daiToken.address);
  await tokenRepository.registerToken(Currencies.TRUE_USD, trueUsdToken.address);

  return [stablecoinDeposit, daiToken, trueUsdToken];
};

module.exports = {deployDeposit};
