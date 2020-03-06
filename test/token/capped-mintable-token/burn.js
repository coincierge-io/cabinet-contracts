const {expect} = require('../../../helpers');
const {expectVMException, million, toBigNumber} = require('../../helpers/utils');
const {deployCappedMintableToken} = require('../../helpers/deploy');
const {getDefaultAddress, getContributor} = require('../../helpers/address');

contract('CappedMintableToken: burn', accounts => {
  const MAX_SUPPLY = million(7000);
  let mintableToken;

  beforeEach(async () => {
    mintableToken = await deployCappedMintableToken(accounts, MAX_SUPPLY);
    await mintableToken.mint(
      getContributor(accounts, 1),
      MAX_SUPPLY,
      {from: getDefaultAddress(accounts)}
    );
  });

  it('should allow users to burn tokens', async () => {
    await mintableToken.burn(million(1000), {from: getContributor(accounts, 1)});
    const totalSupply = await mintableToken.totalSupply.call();
    const expected = toBigNumber(MAX_SUPPLY).sub(million(1000)).toString();

    expect(totalSupply.toString()).to.equal(expected);
  });

  it('should have a max supply of x tokens at any point an disallow any more tokens to be minted', async () => {
    await mintableToken.burn(million(1000), {from: getContributor(accounts, 1)});
    await mintableToken.mint(
      getContributor(accounts, 1),
      million(1000),
      {from: getDefaultAddress(accounts)}
    );

    await expectVMException(
      mintableToken.mint(
        getContributor(accounts, 1),
        1,
        {from: getDefaultAddress(accounts)}
      )
    );
  });
});
