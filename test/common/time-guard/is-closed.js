const {expect} = require('../../helpers')
const {deployTimeGuard} = require('../../helpers/deploy')
const {add} = require('../../helpers/date')
const {increaseTimeTo} = require('../../helpers/timeUtils')

contract('TimeGuard: isClosed', accounts => {
  it('should return true if the current block time is greater than the closing time', async () => {
    const params = {
      openingTime: add(1),
      closingTime: add(30)
    }

    const customTimeGuard = await deployTimeGuard(accounts, params);;

    await increaseTimeTo(add(31));

    const isClosed = await customTimeGuard.isClosed();
    
    expect(isClosed).to.equal(true);
  })
})
