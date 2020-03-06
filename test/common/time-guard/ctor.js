const {expect} = require('../../../../common/test/helpers')
const {deployTimeGuard} = require('../../helpers/deploy')
const {shouldFailWithMessage} = require('../../../../common/test/helpers/utils')
const {add, sub} = require('../../../../common/test/helpers/date')

contract('TimeGuard: ctor', accounts => {
  it('should save the opening and closing time', async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }

    const customTimeGuard = await deployTimeGuard(accounts, params);
    const contractOpeningTime = await customTimeGuard.openingTime();
    const contractClosingTime = await customTimeGuard.closingTime();

    expect(contractOpeningTime.toNumber()).to.equal(params.openingTime);
    expect(contractClosingTime.toNumber()).to.equal(params.closingTime);
  })

  it('should revert if the opening time greater than the current blocktime', async () => {
    const params = {
      openingTime: sub(10),
      closingTime: add(3)
    }

    await shouldFailWithMessage(
      deployTimeGuard(accounts, params),
      'Opening time cannot be before the current block time'
    );
  })

  it('should revert if the closing time earlier than the opening time', async () => {
    const params = {
      openingTime: add(3),
      closingTime: sub(10)
    }

    await shouldFailWithMessage(
      deployTimeGuard(accounts, params),
      'Closing time cannot be after the opening time'
    );
  })
})  
