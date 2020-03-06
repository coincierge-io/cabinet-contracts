const CappedMintableToken = artifacts.require('CappedMintableToken')
const {expect, expectBignumberEqual} = require('../../helpers/')
const {deployEscrowManager, totalSupplyInMillions, tokenAvailableForSaleInMillions} = require('../../helpers/deploy')
const {shouldFailWithMessage, million} = require('../../helpers/utils')
const {
  getDefaultAddress, 
  getWalletAddress, 
  ZERO_ADDRESS, 
  EOA_ADDRESS
} = require('../../helpers/address')

contract('EscrowManager: constructor', accounts => {
  let escrowManager;

  beforeEach(async () => {
    escrowManager = await deployEscrowManager(accounts);
  })
  
  it('should successfully store the owner address', async () => {
    const owner = await escrowManager.owner();

    expect(owner).to.equal(getDefaultAddress(accounts));
  })

  it('should successfully store the wallet address', async () => {
    const wallet = await escrowManager.wallet();

    expect(wallet).to.equal(getWalletAddress(accounts));
  })

  it('should succesfully store the tokenAvailableForSale', async () => { 
    const tokenAvailableForSale = await escrowManager.tokenAvailableForSale.call();
    
    expectBignumberEqual(tokenAvailableForSale, million(tokenAvailableForSaleInMillions));
  })

  it('should succesfully store the totalSupply', async () => {
    const totalSupply = await escrowManager.totalSupply.call();
    expectBignumberEqual(totalSupply, million(totalSupplyInMillions));
  })

  it('should successfully deploy and store the TokenDistribution address', async () => {
    const tokenDistribution = await escrowManager.tokenDistribution();

    expect(tokenDistribution).to.not.equal(undefined); // is differente every time
    expect(tokenDistribution.length).to.equal(42);
  })

  it('should successfully deploy and store the CappedMintableToken address', async () => {
    const erc20 = await escrowManager.erc20();

    expect(erc20).to.not.equal(undefined); // is different every time
    expect(erc20.length).to.equal(42);
  })

  it('should store the correct values for the detailed erc20', async () => {
    const erc20 = await escrowManager.erc20();
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);

    const name = await cappedMintableTokenInstance.name();
    const symbol = await cappedMintableTokenInstance.symbol();

    expect(name).to.equal('Reference Token');
    expect(symbol).to.equal('RFT');
  })

  it('should successfully deploy the CappedMintableToken address and assign the correct cap value', async () => {
    const erc20 = await escrowManager.erc20();
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);
  
    const cap = await cappedMintableTokenInstance.cap();

    expectBignumberEqual(cap, million(totalSupplyInMillions));
  })

  it('should deploy the EthEscrow contract', async () => {
    const ethEscrow = await escrowManager.ethEscrow();
    expect(ethEscrow).to.not.equal(undefined);
  })

  it('should deploy the StablecoinEscrow contract', async () => {
    const stablecoinEscrow = await escrowManager.stablecoinEscrow();
    expect(stablecoinEscrow).to.not.equal(undefined);
  })

  it('should revert if tokens available for sale is greater than the total supply of the token', async () => {
    const params = {
      tokenAvailableForSaleInMillions: million(400),
      totalSupplyInMillions: million(300)
    }
    
    await shouldFailWithMessage(
      deployEscrowManager(accounts, params),
      'Tokens available for sale should not exceed the total token supply'
    );
  })

  it('should revert if wallet address is an invalid address', async () => {
    const params = {
      wallet: ZERO_ADDRESS
    }

    await shouldFailWithMessage(
       deployEscrowManager(accounts, params),
       'Wallet must be a valid address'
    );
  })

  it('should revert if whitelist oracle is not a contract address', async () => {
    const params = {
      whitelistOracle: EOA_ADDRESS
    }

    await shouldFailWithMessage(
       deployEscrowManager(accounts, params),
       'Whitelist should be a contract address'
    );
  })

  it('should revert if token repository is not a contract address', async () => {
    const params = {
      tokenRepository: EOA_ADDRESS
    }

    await shouldFailWithMessage(
       deployEscrowManager(accounts, params),
       'Token repository should be a contract address'
    );
  })
})
