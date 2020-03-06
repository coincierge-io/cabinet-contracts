const {expect} = require('../../../../common/test/helpers')
const {deployTimeGuard} = require('../../helpers/deploy')
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils')
const {add, sub} = require('../../../../common/test/helpers/date')

contract('TimeGuard: updateTime', accounts => {
  let customTimeGuard;
  
  beforeEach(async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }

    customTimeGuard = await deployTimeGuard(accounts, params);
  })

  it('should save the opening and closing time', async () => {
    const openingTime = add(2);
    const closingTime = add(60);

    await customTimeGuard.updateTime(openingTime, closingTime);
    const contractOpeningTime = await customTimeGuard.openingTime();
    const contractClosingTime = await customTimeGuard.closingTime();

    expect(contractOpeningTime.toNumber()).to.equal(openingTime);
    expect(contractClosingTime.toNumber()).to.equal(closingTime);
  })

  it('should revert if the opening time greater than the current blocktime', async () => {
    const openingTime = sub(10);
    const closingTime = add(3);

    await shouldFailWithMessage(
      customTimeGuard.updateTime(openingTime, closingTime),
      'Opening time cannot be before the current block time'
    );
  })

  it('should revert if the closing time earlier than the current blocktime', async () => {
    const openingTime = add(3);
    const closingTime = sub(10);

    await shouldFailWithMessage(
      customTimeGuard.updateTime(openingTime, closingTime),
      'Closing time cannot be after the opening time'
    );
  })
})  
