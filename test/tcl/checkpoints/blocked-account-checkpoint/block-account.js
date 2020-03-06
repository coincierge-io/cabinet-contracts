const {expect} = require('../../helpers');
const {shouldFailWithMessage} = require('../../../helpers/utils');
const {findEvent} = require('../../../helpers/events');
const {ZERO_ADDRESS} = require('../../../helpers/address');
const {deployBlockAccountCheckpoint} = require('../../utils');
const {deployCappedMintableToken} = require('../../../helpers/deploy');

contract('BlockedAccountCheckpoint: blockAccount', accounts => {
  const mainController = accounts[1];
  let blockAccountCheckpoint;
  let token;

  beforeEach(async () => {
    token = await deployCappedMintableToken(accounts);
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
  })

  it('should allow controller to to block multiple accounts', async () => {
    const account = accounts[2];
    const account2 = accounts[3];

    await blockAccountCheckpoint.blockAccount(account, {from: mainController});
    const isBlocked = await blockAccountCheckpoint.isBlocked(account);
    expect(isBlocked).to.equal(true);

    await blockAccountCheckpoint.blockAccount(account2, {from: mainController});
    const isBlocked2 = await blockAccountCheckpoint.isBlocked(account2);

    expect(isBlocked2).to.equal(true);
  })

  it('should emit AccountBlocked event', async () => {
    const account = accounts[2];

    const {receipt: {logs}} = await blockAccountCheckpoint.blockAccount(
      account,
      {from: mainController}
    );

    const {args} = findEvent(logs, 'AccountBlocked');

    expect(args.account).to.equal(account);
  })

  it('should revert if called by someone who doesnt have the Controller Role', async () => {
    const account = accounts[2];

    await shouldFailWithMessage(
      blockAccountCheckpoint.blockAccount(account, {from: account}),
      'Only controller role'
    )
  })

  it('should revert if account is an empty address', async () => {
    await shouldFailWithMessage(
      blockAccountCheckpoint.blockAccount(ZERO_ADDRESS, {from: mainController}),
      'Address cannot be empty'
    ) 
  })
})
