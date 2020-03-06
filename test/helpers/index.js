const expect = require('chai')
  .expect;

const expectBignumberEqual = (a, b) => expect(a.toString()).to.be.equal(b.toString());

module.exports = {
  expect,
  expectBignumberEqual
}
