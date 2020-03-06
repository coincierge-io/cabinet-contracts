const {assert} = require('chai');

const findEvent = (logs, eventName) => {
  const event = logs.find(e => e.event === eventName);
  assert.exists(event);
  return event;
};

const inTransaction = async (tx, eventName) => {
  const {logs} = await tx;
  return findEvent(logs, eventName);
};

module.exports = {
  findEvent,
  inTransaction
};
