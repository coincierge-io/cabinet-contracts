const {toHex, hexToBytes} = require('../../helpers/utils');
const {getTclActors} = require('../../helpers/address');
const {deployClaimRegistry} = require('../../identity/utils');
const {deployTclRepository, deployTclController} = require('../../tcl/utils');
const {deployCng1400} = require('../../helpers/deploy');

const setupTests = async accounts => {
  const EMPTY_DATA = hexToBytes(toHex('empty_bytes_data'));
  const {issuer, mainController} = getTclActors(accounts);
  const investor = accounts[4];
  const investor2 = accounts[5];
  const investor3 = accounts[6];
  const investor4 = accounts[7];
  const investor5 = accounts[8];

  const params = {account: mainController};
  const tclRepository = await deployTclRepository(accounts, {account: mainController});
  const tclController = await deployTclController(accounts, {tclRepository: tclRepository.address, account: mainController});
  const claimRegistry = await deployClaimRegistry(accounts, params);
  const cng1400 = await deployCng1400(accounts, {claimRegistry, tclController});

  const registerSingleAddress = async (accountId, ethAddress) => {
    await claimRegistry.registerAccount(
      accountId,
      ethAddress,
      {from: mainController}
    );
  }

  const registerMultipleAccountForAccountId = async accountId => {
    await claimRegistry.registerAccount(
      accountId,
      investor,
      {from: mainController}
    );

    await claimRegistry.registerAccount(
      accountId,
      investor2,
      {from: mainController}
    );
    
    await claimRegistry.registerAccount(
      accountId,
      investor3,
      {from: mainController}
    );
  }

  return {
    cng1400,
    issuer,
    investor,
    investor2,
    investor3,
    investor4,
    investor5,
    EMPTY_DATA,
    registerSingleAddress,
    registerMultipleAccountForAccountId
  };
};

module.exports = {setupTests}
