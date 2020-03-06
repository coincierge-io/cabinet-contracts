const MintableToken = artifacts.require('ERC20Capped')
const TokenVesting = artifacts.require('TokenVesting')
const {expect, expectBignumberEqual} = require('../../../../common/test/helpers')
const {expectVMException, getBlock, getTokens, million, toBigNumber} = require('../../../../common/test/helpers/utils')
const {getContributor, getTokenOwnerAddress} = require('../../../../common/test/helpers/address')
const {toSolDate} = require('../../../../common/test/helpers/date')
const {increaseTimeTo, duration} = require('../../../../common/test/helpers/timeUtils')
const {deployTokenVestingFactory} = require('../../helpers/deploy')

contract('TokenVesting - release', accounts => {
  const vestedAmount = toBigNumber(getTokens(million(1)));
  // start 30 days from now
  const start = toSolDate(Date.now()) + duration.days(30);
  // 3 months cliff period
  const cliff = duration.months(3);
  // 40 months duration which makes 2.5% release each month
  const vestingDuration = duration.months(40);

  const getReleaseAmount = ts => vestedAmount
    .mul(toBigNumber(ts - start))
    .div(toBigNumber(vestingDuration))

  const beneficiary = getContributor(accounts, 1);
  const vestingData = [
    beneficiary,
    start, 
    cliff, 
    vestingDuration, 
    true
  ];

  let mintableToken;
  let vestingContract;

  const setup = async (params = vestingData) => {
    const vestingFactory = await deployTokenVestingFactory();
    await vestingFactory.deploy(...params);

    const vestingContractAddress = await vestingFactory.getVestingAddress(beneficiary);
    vestingContract = await TokenVesting.at(vestingContractAddress);

    mintableToken = await MintableToken.new(getTokens(million(10)), {from: getTokenOwnerAddress(accounts)});

    await mintableToken.mint(vestingContract.address, vestedAmount, {from: getTokenOwnerAddress(accounts)});
  }

  beforeEach(async () => {
    await setup();
  })

  it('should revert if release if called before the cliff period', async () => {
    await expectVMException(
      vestingContract.release(mintableToken.address)
    )
  })

  it('should release the correct amount of tokens after cliff', async () => {
    await increaseTimeTo(start + cliff);
    const {receipt: {blockNumber}} = await vestingContract.release(mintableToken.address);
    const {timestamp} = await getBlock(blockNumber);
    const balance = await mintableToken.balanceOf(beneficiary);

    expectBignumberEqual(toBigNumber(balance), getReleaseAmount(timestamp));
  })

  it('should release gradually during the vesting period', async () => {
    for(let i = 1; i <= 5; i ++) {
      await increaseTimeTo(start + cliff + duration.months(i));
      const {receipt: {blockNumber}} = await vestingContract.release(mintableToken.address);
      const {timestamp} = await getBlock(blockNumber);
      const balance = await mintableToken.balanceOf(beneficiary);
      expect(balance).to.be.bignumber.equal(getReleaseAmount(timestamp));
    }
  })  

  it('should release the entire vested amount at the end of the period', async () => {
    await increaseTimeTo(start + vestingDuration);
    await vestingContract.release(mintableToken.address);
    const balance = await mintableToken.balanceOf(beneficiary);
    expect(balance).to.be.bignumber.equal(vestedAmount);
  })
})

