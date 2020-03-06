const MintableToken = artifacts.require('ERC20Capped')
const TokenVesting = artifacts.require('TokenVesting')
const {expectBignumberEqual} = require('../../../../common/test/helpers')
const {expectVMException, getBlock, getTokens, million, toBigNumber} = require('../../../../common/test/helpers/utils')
const {getContributor, getDefaultAddress, getTokenOwnerAddress} = require('../../../../common/test/helpers/address')
const {increaseTimeTo, duration} = require('../../../../common/test/helpers/timeUtils')
const {toSolDate} = require('../../../../common/test/helpers/date')
const {deployTokenVestingFactory} = require('../../helpers/deploy')

contract('TokenVesting - revoke', accounts => {
  const vestedAmount = toBigNumber(getTokens(million(1)));
  // start 30 days from now
  const start = toSolDate(Date.now()) + duration.days(30);
  // 3 months cliff period
  const cliff = duration.months(3);
  // 40 months duration which makes 2.5% release each month
  const vestingDuration = duration.months(40);

  const getReleaseAmount = ts => vestedAmount
    .mul(toBigNumber(ts - start))
    .divRound(toBigNumber(vestingDuration))

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

  it('should revert if revocable not set', async () => {
    await setup([
      beneficiary,
      start, 
      cliff, 
      vestingDuration, 
      false
    ]);

    await expectVMException(
      vestingContract.revoke(mintableToken.address, {from: getDefaultAddress(accounts)})
    )
  })

  it('should be called by the owner only', async () => {
    await expectVMException(
      vestingContract.revoke(mintableToken.address, {from: getContributor(accounts, 1)})
    )
  })

  it.skip('should transfer the remaining tokens back to the owner', async () => {
    await increaseTimeTo(start + cliff + duration.months(15));
    const {receipt: {blockNumber}} = await vestingContract.release(mintableToken.address);
    const {timestamp} = await getBlock(blockNumber);
    const released = getReleaseAmount(timestamp);

    await vestingContract.revoke(mintableToken.address, {from: getDefaultAddress(accounts)});
    const ownerBalance = await mintableToken.balanceOf(getDefaultAddress(accounts));

    expectBignumberEqual(vestedAmount.sub(released), toBigNumber(ownerBalance));
  })

  it('should revert is called multiple times', async () => {
    await vestingContract.revoke(mintableToken.address, {from: getDefaultAddress(accounts)});

    await expectVMException(
      vestingContract.revoke(mintableToken.address, {from: getDefaultAddress(accounts)})
    )
  })
})

