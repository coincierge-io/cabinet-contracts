const {time} = require('openzeppelin-test-helpers');

const latestTime = time.latest;

const send = (method, id = Date.now(), params = []) => new Promise(
  (resolve, reject) => {
    const callback = (err, result) => {
      if (err) return reject(err);
      resolve(result);
    };

    const options = {
      jsonrpc: '2.0',
      method,
      params,
      id
    };

    web3.currentProvider.sendAsync(options, callback);
  }
);

// Increases testrpc time by the passed duration in seconds
const increaseTime = time.increase;

/**
 * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
 * it's hard to increase time precisely to a target point so design your test to tolerate
 * small fluctuations from time to time.
 *
 * @param target time in seconds
 */
const increaseTimeTo = async seconds => {
  if (String(seconds).length !== 10) {
    throw Error(`It looks like ${seconds} is not in seconds format. For blockchain dates only seconds are accepted.`);
  }

  const currentTime = await latestTime();

  if (currentTime.toNumber() < seconds) {
    await time.increaseTo(seconds);
  }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const seconds = val => val;
const minutes = val => val * seconds(60);
const hours = val => val * minutes(60);
const days = val => val * hours(24);
const weeks = val => val * days(7);
const months = val => val * days(30);
const years = val => val * days(365);

module.exports = {
  latestTime,
  increaseTime,
  increaseTimeTo,
  delay,
  send,
  duration: {
    seconds, minutes, hours, days, weeks, months, years
  }
};
