const {expectBignumberEqual, expect} = require('../../../../common/test/helpers');
const {toHex, hexToBytes, hexToUtf8, getTokens} = require('../../../../common/test/helpers/utils');
const {getTclActors} = require('../../../../common/test/helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {setupCountryLimitCheckpoint} = require('../utils');
const {findEvent} = require('../../helpers/events');

contract('erc1594: redeem', accounts => {
  let cng1400;

  const {
    issuer,
    authorisedHolder
  } = getTclActors(accounts);
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'))

  beforeEach(async () => {
    ({cng1400} = await deployAndSetupCng1400(accounts));
  });

  it('should redeem tokens correctly', async () => {
    let totalSupply;
    await cng1400.issue(authorisedHolder, getTokens(100), EMPTY_DATA, {from: issuer});
    totalSupply = await cng1400.totalSupply();

    const {receipt: {logs}} = await cng1400.redeem(getTokens(100), EMPTY_DATA, {from: authorisedHolder});

    const {args} = await findEvent(logs, 'Redeemed');

    expect(args.from).to.equal(authorisedHolder);
    expect(args.operator).to.equal(authorisedHolder);
    expectBignumberEqual(args.value, getTokens(100));
    expect(hexToUtf8(args.data)).to.equal('empty_bytes_data');

    totalSupply = await cng1400.totalSupply();
    const balance = await cng1400.balanceOf(authorisedHolder);
    expectBignumberEqual(balance, 0);
    expectBignumberEqual(totalSupply, 0);
  });

  it('should allow a transfer after an account that reached the country limit has redeemed tokens', async () => {
    const sender = accounts[2];
    const recipient = accounts[3];
    const recipient2 = accounts[4];
    
    const {cng1400} = await setupCountryLimitCheckpoint(accounts, sender, recipient, recipient2);

    // country limit reached after recipient receives tokens
    await cng1400.issue(sender, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.transfer(recipient, getTokens(100), {from: sender});

    const result = await cng1400.canTransfer(recipient2, getTokens(50), EMPTY_DATA, {from: sender});
    expect(result[0]).to.equal(false);

    // redeem after country limit reached
    await cng1400.redeem(getTokens(100), EMPTY_DATA, {from: recipient});

    // transfer after full redeem should be ok as the country limit from the country has decreased
    const result2 = await cng1400.transfer.call(recipient2, getTokens(50), {from: sender});
    expect(result2).to.equal(true);
  });
});
