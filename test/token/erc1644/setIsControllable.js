const {expect} = require('../../../helpers');
const {getTclActors} = require('../../helpers/address');
const {deployAndSetupCng1400} = require('../../helpers/deploy');
const {shouldFailWithMessage} = require('../../helpers/utils');

contract('erc1644: setIsControllable', accounts => {
  let cng1400;

  const {issuer, dodgyGuy} = getTclActors(accounts);

  beforeEach(async () => {
    ({cng1400} = await deployAndSetupCng1400(accounts));
  });

  it('should set correct values of isControllable', async () => {
    let isControllable;

    isControllable = await cng1400.isControllable();
    expect(isControllable).to.equal(false);

    await cng1400.setIsControllable(true, {from: issuer});

    isControllable = await cng1400.isControllable();
    expect(isControllable).to.equal(true);
  });

  it('should fail is setIsControllable is called by nonIssuer', async () => {
    await shouldFailWithMessage(
      cng1400.setIsControllable(true, {from: dodgyGuy}),
      'Only issuer role'
    );
  });
});
