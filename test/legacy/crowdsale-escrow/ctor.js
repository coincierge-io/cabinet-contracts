const CappedMintableToken = artifacts.require('CappedMintableToken')
const {expect, expectBignumberEqual} = require('../../helpers')
const {deployCrowdsaleEscrow, totalSupplyInMillions, tokenAvailableForSaleInMillions} = require('../../helpers/deploy')
const {expectVMException, million} = require('../../helpers/utils')
const {getDefaultAddress, getWalletAddress, ZERO_ADDRESS} = require('../../helpers/address')
const {add, sub} = require('../../helpers/date')


contract('CrowdsaleEscrow: constructor', accounts => {
  let crowdsaleEscrow;

  beforeEach(async () => {
    crowdsaleEscrow = await deployCrowdsaleEscrow(accounts);
  })

  it('should default the isRefundEnabled to false', async () => {
    const isRefundEnabled = await crowdsaleEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(false);
  })

  it('should successfully store the owner address', async () => {
    const owner = await crowdsaleEscrow.owner();

    expect(owner).to.equal(getDefaultAddress(accounts));
  })

  it('should successfully store the wallet address', async () => {
    const wallet = await crowdsaleEscrow.wallet();

    expect(wallet).to.equal(getWalletAddress(accounts));
  })

  it('should successfully store the opening and closing time', async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }
    
    const customTimeCrowdsaleEscrow = await deployCrowdsaleEscrow(accounts, params);
    const contractOpeningTime = await customTimeCrowdsaleEscrow.openingTime();
    const contractClosingTime = await customTimeCrowdsaleEscrow.closingTime();

    expect(contractOpeningTime.toNumber()).to.equal(params.openingTime);
    expect(contractClosingTime.toNumber()).to.equal(params.closingTime);
  })

  it('should successfully store the WhitelistOracle address', async () => {
    const whitelistOracle = await crowdsaleEscrow.whitelistOracle();

    expect(whitelistOracle).to.not.equal(undefined); // is differente every time
    expect(whitelistOracle.length).to.equal(42);
  })

  it('should succesfully store the tokenAvailableForSale', async () => { 
    const tokenAvailableForSale = await crowdsaleEscrow.tokenAvailableForSale.call();
    
    expectBignumberEqual(tokenAvailableForSale, million(tokenAvailableForSaleInMillions));
  })

  it('should succesfully store the totalSupply', async () => {
    const totalSupply = await crowdsaleEscrow.totalSupply.call();
    expectBignumberEqual(totalSupply, million(totalSupplyInMillions));
  })

  it('should successfully deploy and store the TokenDistribution address', async () => {
    const tokenDistribution = await crowdsaleEscrow.tokenDistribution();

    expect(tokenDistribution).to.not.equal(undefined); // is differente every time
    expect(tokenDistribution.length).to.equal(42);
  })

  it('should successfully deploy and store the CappedMintableToken address', async () => {
    const erc20 = await crowdsaleEscrow.erc20();

    expect(erc20).to.not.equal(undefined); // is different every time
    expect(erc20.length).to.equal(42);
  })

  it('should store the correct values for the detailed erc20', async () => {
    const erc20 = await crowdsaleEscrow.erc20();
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);

    const name = await cappedMintableTokenInstance.name();
    const symbol = await cappedMintableTokenInstance.symbol();

    expect(name).to.equal('Reference Token');
    expect(symbol).to.equal('RFT');
  })

  it('should successfully deploy the CappedMintableToken address and assign the correct cap value', async () => {
    const erc20 = await crowdsaleEscrow.erc20();
    const cappedMintableTokenInstance = await CappedMintableToken.at(erc20);
  
    const cap = await cappedMintableTokenInstance.cap();

    expectBignumberEqual(cap, million(totalSupplyInMillions));
  })

  it('should revert if tokens available for sale is greater than the total supply of the token', async () => {
    const params = {
      tokenAvailableForSaleInMillions: million(400),
      totalSupplyInMillions: million(300)
    }
    
    await expectVMException(
      deployCrowdsaleEscrow(accounts, params)
    );
  })

  it('should revert if opening time is in the past', async () => {
    const params = {
      openingTime: sub(10),
      closingTime: add(3)
    }
    
    await expectVMException(
      deployCrowdsaleEscrow(accounts, params)
    );
  })

  it('should revert if wallet address is an invalid address', async () => {
    const params = {
      wallet: ZERO_ADDRESS
    }

    await expectVMException(
       deployCrowdsaleEscrow(accounts, params)
    );
  })
})
