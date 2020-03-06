const {expect} = require('../../../../../common/test/helpers');
const {sub, add} = require('../../../../../common/test/helpers/date');
const {
  toHex, 
  hexToBytes, 
  hexToUtf8,
  shouldFailWithMessage
} = require('../../../../../common/test/helpers/utils');
const {ZERO_ADDRESS} = require('../../../../../common/test/helpers/address');
const {findEvent} = require('../../../helpers/events');
const {deployTimedKycAmlCheckpoint} = require('../../utils');

contract('TimedKycAmlCheckpoint: updateRegister', accounts => {
  const mainController = accounts[1];
  const expiryData = add(2);
  let kycAmlCheckpoint;

  beforeEach(async () => {
    kycAmlCheckpoint = await deployTimedKycAmlCheckpoint(
      accounts,
      {account: mainController}
    );
  })

  it('should allow the controller to update the register', async () => {
    const account = accounts[2];

    await kycAmlCheckpoint.updateRegister(
      account,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.readRegister(account);

    expect(result[0].toNumber()).to.equal(expiryData);
    expect(hexToUtf8(result[1])).to.equal('onfido');
  })

  it('should allow controller to add multiple reigster records', async () => {
    const account = accounts[2];
    const account2 = accounts[3];

    await kycAmlCheckpoint.updateRegister(
      account,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const result = await kycAmlCheckpoint.readRegister(account);

    expect(result[0].toNumber()).to.equal(expiryData);
    expect(hexToUtf8(result[1])).to.equal('onfido');

    await kycAmlCheckpoint.updateRegister(
      account2,
      expiryData,
      hexToBytes(toHex('civic')),
      {from: mainController}
    );

    const result2 = await kycAmlCheckpoint.readRegister(account2);

    expect(result2[0].toNumber()).to.equal(expiryData);
    expect(hexToUtf8(result2[1])).to.equal('civic');
  })

  it('should emit RegisterUpdated event', async () => {
    const account = accounts[2];

    const {receipt: {logs}} = await kycAmlCheckpoint.updateRegister(
      account,
      expiryData,
      hexToBytes(toHex('onfido')),
      {from: mainController}
    );

    const {args} = findEvent(logs, 'RegisterUpdated');

    expect(args.account).to.equal(account);
  })

  it('should revert if called by someone who doesnt have the Controller Role', async () => {
    const account = accounts[2];

    await shouldFailWithMessage(
      kycAmlCheckpoint.updateRegister(
        account,
        expiryData,
        hexToBytes(toHex('onfido')),
        {from: account}
      ),
      'Only controller role'
    )
  })

  it('should revert if account is an empty address', async () => {
    await shouldFailWithMessage(
      kycAmlCheckpoint.updateRegister(
        ZERO_ADDRESS,
        expiryData,
        hexToBytes(toHex('onfido')),
        {from: mainController}
      ),
      'Address cannot be empty'
    ) 
  })

  it('should revert if the expiry date is in the past', async () => {
    const account = accounts[2];
    
    await shouldFailWithMessage(
      kycAmlCheckpoint.updateRegister(
        account,
        sub(1),
        hexToBytes(toHex('onfido')),
        {from: mainController}
      ),
      'Expiry date should be in the future'
    ) 
  })
});
