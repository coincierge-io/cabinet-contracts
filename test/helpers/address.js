const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const EOA_ADDRESS = '0x602c6b9dd850a38215aaf736bab46889e8772435';

const getTokenOwnerAddress = accounts => accounts[0];
const getDefaultAddress = accounts => accounts[0];
const getWalletAddress = accounts => accounts[1];
const getTeamFundAddress = accounts => accounts[2];
const getBountyAddress = accounts => accounts[3];
const getController = accounts => accounts[4];
const getIssuer = accounts => accounts[10];
const getSpeAddress = accounts => accounts[11];
const getAuthorisedHolder = accounts => accounts[3];
const getContributor = (accounts, i) => {
  if(i < 1 || i > 5) throw Error('Wrong Index');
  return accounts[4 + i];
};

const getNonWhitelistedAdress = accounts => accounts[9];
const getDodgyContributor = accounts => getContributor(accounts, 4);

const getTclActors = accounts => ({
  authorisedHolder: getAuthorisedHolder(accounts),
  dodgyGuy: getDodgyContributor(accounts),
  mainController: getController(accounts),
  issuer: getIssuer(accounts),
  unknownAddress: getContributor(accounts, 1),
  spe: getSpeAddress(accounts)
});

module.exports = {
  ZERO_ADDRESS,
  EOA_ADDRESS,
  getTokenOwnerAddress,
  getDefaultAddress,
  getWalletAddress,
  getContributor,
  getTeamFundAddress,
  getDodgyContributor,
  getBountyAddress,
  getNonWhitelistedAdress,
  getController,
  getAuthorisedHolder,
  getTclActors,
  getSpeAddress
};
