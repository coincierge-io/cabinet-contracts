const {expect} = require('../../helpers/')
const {deployBasicEscrow} = require('../../helpers/deploy')
const {shouldFailWithMessage} = require('../../helpers/utils')
const {getDefaultAddress, getWalletAddress, ZERO_ADDRESS} = require('../../helpers/address')
const {add, sub} = require('../../helpers/date')


contract('BasicEscrow: constructor', accounts => {
  let basicEscrow;

  beforeEach(async () => {
    basicEscrow = await deployBasicEscrow(accounts);
  })

  it('should default the isRefundEnabled to false', async () => {
    const isRefundEnabled = await basicEscrow.isRefundEnabled();

    expect(isRefundEnabled).to.equal(false);
  })

  it('should successfully store the owner address', async () => {
    const owner = await basicEscrow.owner();

    expect(owner).to.equal(getDefaultAddress(accounts));
  })

  it('should successfully store the wallet address', async () => {
    const wallet = await basicEscrow.wallet();

    expect(wallet).to.equal(getWalletAddress(accounts));
  })

  it('should successfully store the opening and closing time', async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }
    
    const customTimeBasicEscrow = await deployBasicEscrow(accounts, params);
    const contractOpeningTime = await customTimeBasicEscrow.openingTime();
    const contractClosingTime = await customTimeBasicEscrow.closingTime();

    expect(contractOpeningTime.toNumber()).to.equal(params.openingTime);
    expect(contractClosingTime.toNumber()).to.equal(params.closingTime);
  })

  it('should successfully store the WhitelistOracle address', async () => {
    const whitelistOracle = await basicEscrow.whitelistOracle();

    expect(whitelistOracle).to.not.equal(undefined); // is differente every time
    expect(whitelistOracle.length).to.equal(42);
  })

  it('should revert if opening time is in the past', async () => {
    const params = {
      openingTime: sub(10),
      closingTime: add(3)
    }
    
    await shouldFailWithMessage(
      deployBasicEscrow(accounts, params),
      'Opening time cannot be before the current block time'
    );
  })

  it('should revert if wallet address is an invalid address', async () => {
    const params = {
      wallet: ZERO_ADDRESS
    }

    await shouldFailWithMessage(
       deployBasicEscrow(accounts, params),
       'Wallet must be a valid address'
    );
  })

  it('should revert if whitelist is not a contract address', async () => {
    const params = {
      whitelistOracle: ZERO_ADDRESS
    }

    await shouldFailWithMessage(
       deployBasicEscrow(accounts, params),
       'Whitelist should be a contract address'
    );
  })
})
