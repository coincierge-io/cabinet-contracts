const {deployAssetRepository, deployMockContract} = require('../../helpers/deploy');
const {expect} = require('../../../../common/test/helpers');
const {getTokenOwnerAddress} = require('../../../../common/test/helpers/address');
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils');


contract('AssetRepository: registerAsset', accounts => {
  const SYMBOL = 'ERC';
  const issuer = getTokenOwnerAddress(accounts);

  let assetRepository; let
    mockContract;

  beforeEach(async () => {
    assetRepository = await deployAssetRepository();
    mockContract = await deployMockContract();
  });

  it('should add the provided asset with the specified address in the assets mapping', async () => {
    const assetAddress = mockContract.address;

    await assetRepository.registerAsset(SYMBOL, assetAddress, {from: issuer});

    const storedAssetAddress = await assetRepository.assets.call(SYMBOL);

    expect(storedAssetAddress).to.be.equal(assetAddress);
  });

  it('should revert if the provided asset is already registered', async () => {
    const assetAddress = mockContract.address;

    await assetRepository.registerAsset(SYMBOL, assetAddress, {from: issuer});

    await shouldFailWithMessage(
      assetRepository.registerAsset(SYMBOL, assetAddress, {from: issuer}),
      'Symbol already exists'
    );
  });
});
