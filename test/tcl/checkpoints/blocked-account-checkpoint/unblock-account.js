const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../../helpers/utils');
const {findEvent} = require('../../../helpers/events');
const {ZERO_ADDRESS} = require('../../../helpers/address');
const {deployBlockAccountCheckpoint} = require('../../utils');

contract('BlockedAccountCheckpoint: unblockAccount', accounts => {
  const mainController = accounts[1];
  let blockAccountCheckpoint;

  beforeEach(async () => {
    blockAccountCheckpoint = await deployBlockAccountCheckpoint(
      accounts,
      {account: mainController}
    );
  })

  it('should allow the controller to block an account', async () => {
    const account = accounts[2];

    await blockAccountCheckpoint.blockAccount(account, {from: mainController});
    const isBlocked = await blockAccountCheckpoint.isBlocked(account);
    expect(isBlocked).to.equal(true);

    await blockAccountCheckpoint.unblockAccount(account, {from: mainController});
    const isBlocked2 = await blockAccountCheckpoint.isBlocked(account);
    expect(isBlocked2).to.equal(false);
    
  })

  it('should emit AccountUnblocked event', async () => {
    const account = accounts[2];

    await blockAccountCheckpoint.blockAccount(account, {from: mainController});
    const {receipt: {logs}} = await blockAccountCheckpoint.unblockAccount(
      account,
      {from: mainController}
    );

    const {args} = findEvent(logs, 'AccountUnblocked');

    expect(args.account).to.equal(account);
  })

  it('should revert if called by someone who doesnt have the Controller Role', async () => {
    const account = accounts[2];

    await shouldFailWithMessage(
      blockAccountCheckpoint.unblockAccount(account, {from: account}),
      'Only controller role'
    )
  })

  it('should revert if account is an empty address', async () => {
    await shouldFailWithMessage(
      blockAccountCheckpoint.unblockAccount(ZERO_ADDRESS, {from: mainController}),
      'Address cannot be empty'
    ) 
  })
})
