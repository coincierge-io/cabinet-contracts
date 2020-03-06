const {expectBignumberEqual} = require('../../../helpers');
const {getTokens} = require('../../helpers/utils');
const {createAccountId} = require('../../identity/utils');
const {setupTests} = require('./utils');

contract('Cng1400/CNG20: transferFrom', async accounts => {
  const accountId2 = createAccountId('Pavlos', 'Polia', 'pp6g11@gmail.com');
  let setupData;
  
  beforeEach(async () => {
    setupData = await setupTests(accounts);
    await setupData.registerSingleAddress(accountId2, setupData.investor4);
  })

  it('should return the correct account balance after when the it has one registered Ethereum addresses', async () => {
    const {
      cng1400, 
      EMPTY_DATA, 
      investor, 
      investor4,
      issuer, 
      registerSingleAddress, 
    } = setupData;

    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await registerSingleAddress(accountId, investor);
    await cng1400.issue(investor, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor});
    await cng1400.transferFrom(investor, investor4, getTokens(50), {from: issuer});

    const accountBalance = await cng1400.getAccountBalance(accountId);
    const investor4Balance = await cng1400.getAccountBalance(accountId2);

    expectBignumberEqual(getTokens(50), accountBalance);
    expectBignumberEqual(getTokens(50), investor4Balance);
  });

  it('should return the correct account balance after when the it has multiple registered Ethereum addresses', async () => {
    const {
      cng1400, 
      EMPTY_DATA, 
      investor, 
      investor2, 
      investor3,
      investor4,
      issuer, 
      registerMultipleAccountForAccountId
    } = setupData;

    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');
    await registerMultipleAccountForAccountId(accountId);

    await cng1400.issue(investor, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor});
    await cng1400.transferFrom(investor, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor2, getTokens(150), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor2});
    await cng1400.transferFrom(investor2, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor3, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor3});
    await cng1400.transferFrom(investor3, investor4, getTokens(50), {from: issuer});

    const accountBalance = await cng1400.getAccountBalance(accountId);
    const investor4Balance = await cng1400.getAccountBalance(accountId2);

    expectBignumberEqual(getTokens(300), accountBalance);
    expectBignumberEqual(getTokens(150), investor4Balance);
  });

  it('should return the correct account balance for different users with various number of eth addresses', async () => {
    const {
      cng1400, 
      EMPTY_DATA, 
      investor, 
      investor2, 
      investor3, 
      investor4, 
      issuer, 
      registerMultipleAccountForAccountId
    } = setupData;
    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await registerMultipleAccountForAccountId(accountId);
    
    await cng1400.issue(investor, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor});
    await cng1400.transferFrom(investor, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor2, getTokens(150), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor2});
    await cng1400.transferFrom(investor2, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor3, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor3});
    await cng1400.transferFrom(investor3, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor4, getTokens(250), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor4});
    await cng1400.transferFrom(investor4, investor3, getTokens(50), {from: issuer});


    const accountBalance = await cng1400.getAccountBalance(accountId);
    const accountBalance2 = await cng1400.getAccountBalance(accountId2);
    
    expectBignumberEqual(getTokens(350), accountBalance);
    expectBignumberEqual(getTokens(350), accountBalance2);
  });

  it('should keep the address balances intact', async () => {
    const {
      cng1400, 
      EMPTY_DATA, 
      investor, 
      investor2, 
      investor3, 
      investor4, 
      issuer, 
      registerMultipleAccountForAccountId
    } = setupData;

    const accountId = createAccountId('Pavlos', 'Polianidis', 'ppoliani@gmail.com');

    await registerMultipleAccountForAccountId(accountId);
    
    await cng1400.issue(investor, getTokens(100), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor});
    await cng1400.transferFrom(investor, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor2, getTokens(150), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor2});
    await cng1400.transferFrom(investor2, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor3, getTokens(200), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor3});
    await cng1400.transferFrom(investor3, investor4, getTokens(50), {from: issuer});
    await cng1400.issue(investor4, getTokens(250), EMPTY_DATA, {from: issuer});
    await cng1400.approve(issuer, getTokens(50), {from: investor4});
    await cng1400.transferFrom(investor4, investor3, getTokens(50), {from: issuer});

    const investorBalance = await cng1400.balanceOf(investor);
    const investor2Balance = await cng1400.balanceOf(investor2);
    const investor3Balance = await cng1400.balanceOf(investor3);
    const investor4Balance = await cng1400.balanceOf(investor4);

    expectBignumberEqual(getTokens(50), investorBalance);
    expectBignumberEqual(getTokens(100), investor2Balance);
    expectBignumberEqual(getTokens(200), investor3Balance);
    expectBignumberEqual(getTokens(350), investor4Balance);
  });
});
