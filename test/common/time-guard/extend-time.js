const {expect} = require('../../helpers')
const {deployTimeGuard} = require('../../helpers/deploy')
const {shouldFailWithMessage} = require('../../helpers/utils')
const {add, sub} = require('../../helpers/date')

contract('TimeGuard: extendTime', accounts => {
  let customTimeGuard;
  
  beforeEach(async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }

    customTimeGuard = await deployTimeGuard(accounts, params);
  })

  it('should save the new closing time', async () => {
    const closingTime = add(60);

    await customTimeGuard.extendTime(closingTime);
    const contractClosingTime = await customTimeGuard.closingTime();

    expect(contractClosingTime.toNumber()).to.equal(closingTime);
  })

  it('should revert if the closing time earlier than the current blocktime', async () => {
    const params = {
      openingTime: add(10),
      closingTime: add(30)
    }

    customTimeGuard = await deployTimeGuard(accounts, params);
    const closingTime = add(5);

    await shouldFailWithMessage(
      customTimeGuard.extendTime(closingTime),
      'Closing time cannot be after existing opening time'
    );
  })
})
