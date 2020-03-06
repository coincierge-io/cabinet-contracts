const TokenVesting = artifacts.require('TokenVesting')
const {expect} = require('../../helpers')
const {expectVMException} = require('../../helpers/utils')
const {duration} = require('../../helpers/timeUtils')
const {ZERO_ADDRESS, getContributor, getDefaultAddress} = require('../../helpers/address')
const {findEvent} = require('../../helpers/events')
const {deployTokenVestingFactory} = require('../../helpers/deploy')

contract('TokenVestingFactory: deploy', accounts => {
  const defaultBeneficiary = getContributor(accounts, 1);
  const start = Date.now() + duration.days(30);
  const cliff = duration.months(3);
  const vestingDuration = duration.months(40);
  const vestingData = [defaultBeneficiary, start, cliff, vestingDuration, true];
  
  let vestingFactory;


  beforeEach(async () => {
    vestingFactory = await deployTokenVestingFactory();
  })

  it('should revert if transaction is not sent from the owner of the contract', async () => {
    await expectVMException(
      vestingFactory.deploy(...vestingData, {from: getContributor(accounts, 2)})
    )
  })

  it('should revert if beneficiary has an invalid address', async () => {
    const [_, ...tail] = vestingData;
    const param = [ZERO_ADDRESS, ...tail];

    await expectVMException(
      vestingFactory.deploy(...param)
    )
  })

  it('should log LogTokenVestingDeployed', async () => {
    const {receipt: {blockNumber, logs}} = await vestingFactory.deploy(...vestingData);
    const vestingAdddress = await vestingFactory.getVestingAddress(defaultBeneficiary);
    const {args} = findEvent(logs, 'LogTokenVestingDeployed');

    expect(args.beneficiary).to.equal(defaultBeneficiary);
    expect(args.tokenVesting).to.equal(vestingAdddress);
  })
  
  it('should successfully deploy a new token vesting contract for the given beneficiary', async () => {
    await vestingFactory.deploy(...vestingData);
    const vestingAdddress = await vestingFactory.getVestingAddress(defaultBeneficiary);

    expect(vestingAdddress).to.not.equal(ZERO_ADDRESS);
  })

  it('should deploy and store the vesting contract data', async () => {
    await vestingFactory.deploy(...vestingData);
    const result = await vestingFactory.getVestingData(defaultBeneficiary);

    expect(result[0].toNumber()).to.equal(start);
    expect(result[1].toNumber()).to.equal(cliff);
    expect(result[2].toNumber()).to.equal(vestingDuration);
  })

  it('should transfer the ownership of the vesting contract to the owner of the factory contract', async () => {
    await vestingFactory.deploy(...vestingData);
    const vestingAdddress = await vestingFactory.getVestingAddress(defaultBeneficiary);
    const tokenVesting = await TokenVesting.at(vestingAdddress);
    const owner = await tokenVesting.owner.call();

    expect(owner).to.equal(getDefaultAddress(accounts));
  })
});
