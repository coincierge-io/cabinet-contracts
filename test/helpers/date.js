const addDays = require('date-fns/addDays');
const subDays = require('date-fns/subDays');
const getTime = require('date-fns/getTime');

const toSolDate = ts => Math.floor(ts / 1000);
const fromSolDate = ts => Math.floor(ts * 1000);
const now = () => toSolDate(Date.now());
const add = (amount, base = Date.now()) => toSolDate(getTime(addDays(base, amount)));
const sub = (amount, base = Date.now()) => toSolDate(getTime(subDays(base, amount)));

module.exports = {
  now,
  add,
  sub,
  fromSolDate,
  toSolDate
};
