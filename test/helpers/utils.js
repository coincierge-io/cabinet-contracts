const {expectRevert} = require('openzeppelin-test-helpers');
const {increaseTimeTo} = require('./timeUtils');

const DEFAULT_GAS_PRICE = web3.utils.toBN(web3.utils.toWei('11', 'gwei'));

const expectVMException = expectRevert.unspecified;
const expectInvalidOpCode = expectRevert.invalidOpcode;
const shouldFailWithMessage = expectRevert;

const getBlock = async blockNumber => await web3.eth.getBlock(blockNumber);
const getBalance = async addr => await web3.eth.getBalance(addr);
const getTokenBalance = async (token, addr) => await token.balanceOf(addr);
const getGasCost = gasUsed => toBigNumber(gasUsed).mul(DEFAULT_GAS_PRICE);
const getTransactionReceipt = async txHash => await web3.eth.getTransactionReceipt(txHash);
const toWei = (amount, denomination) => web3.utils.toWei(`${amount}`, denomination);
const toBigNumber = amount => web3.utils.toBN(amount);

const milTokens = toBigNumber(10).pow(toBigNumber(6));
const getTokens = num => toBigNumber(10)
  .pow(toBigNumber(18))
  .mul(toBigNumber(num));

const million = mil => toBigNumber(mil)
  .mul(getTokens(milTokens));

const toHex = value => web3.utils.toHex(value);
const hexToBytes = hex => web3.utils.hexToBytes(hex);
const hexToUtf8 = hex => web3.utils.hexToUtf8(hex);
const bytesToHex = bytes => web3.utils.bytesToHex(bytes);
const padLeft = (str, charAmount) => web3.utils.padLeft(str, charAmount);
const padRight = (str, charAmount) => web3.utils.padRight(str, charAmount);
const {soliditySha3} = web3.utils;
const {encodeFunctionSignature} = web3.eth.abi;
const asciiToHex = str => web3.utils.asciiToHex(str);
const encodeBytes32Param = str => asciiToHex(str);


// helpful utility to check if balance of an address has changed
// after a certain action, for example after we trigger a withdrawEther() function
const balanceDeltaAfterAction = async (address, action, includeGasCost = true) => {
  const addressBalanceBeforeAction = await getBalance(address);

  // trigger action
  let {receipt: {cumulativeGasUsed: gasToWithdraw}} = await action();
  gasToWithdraw = getGasCost(gasToWithdraw);

  const addressBalanceAfterAction = await getBalance(address);

  const balanceDelta = includeGasCost
    ? toBigNumber(addressBalanceAfterAction)
      .add(gasToWithdraw)
      .sub(toBigNumber(addressBalanceBeforeAction))
    : toBigNumber(addressBalanceAfterAction)
      .sub(toBigNumber(addressBalanceBeforeAction));

  return balanceDelta;
};

const moveToOpeningTime = async crowdsale => {
  const openingTime = await crowdsale.openingTime();
  await increaseTimeTo(openingTime.toNumber() + 1);
};

const moveToClosingTime = async crowdsale => {
  const closingTime = await crowdsale.closingTime();
  await increaseTimeTo(closingTime.toNumber() + 1);
};

module.exports = {
  expectVMException,
  expectInvalidOpCode,
  shouldFailWithMessage,
  getBlock,
  getTokenBalance,
  getBalance,
  getGasCost,
  getTransactionReceipt,
  toWei,
  toBigNumber,
  million,
  getTokens,
  toHex,
  hexToBytes,
  hexToUtf8,
  bytesToHex,
  padLeft,
  padRight,
  soliditySha3,
  encodeFunctionSignature,
  balanceDeltaAfterAction,
  moveToOpeningTime,
  moveToClosingTime,
  encodeBytes32Param
};
