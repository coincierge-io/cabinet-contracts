const {expectBignumberEqual} = require('../../../../common/test/helpers');
const {expectVMException, million} = require('../../../../common/test/helpers/utils');
const {deployCappedMintableToken, deployAtomicSwap} = require('../../helpers/deploy');
const {getDefaultAddress, getContributor} = require('../../../../common/test/helpers/address');

contract('AtomicSwap: swap', accounts => {
  const MAX_SUPPLY = million(7000);
  let mintableToken1;
  let mintableToken2;
  let mintableToken3;
  let mintableToken4;
  let atomicSwap;

  beforeEach(async () => {
    atomicSwap = await deployAtomicSwap(accounts);
    mintableToken1 = await deployCappedMintableToken(accounts, MAX_SUPPLY);
    await mintableToken1.mint(
      getContributor(accounts, 1),
      500,
      {from: getDefaultAddress(accounts)}
    );
    mintableToken2 = await deployCappedMintableToken(accounts, MAX_SUPPLY);
    await mintableToken2.mint(
      getContributor(accounts, 2),
      1000,
      {from: getDefaultAddress(accounts)}
    );
    mintableToken3 = await deployCappedMintableToken(accounts, MAX_SUPPLY);
    await mintableToken3.mint(
      getContributor(accounts, 3),
      1500,
      {from: getDefaultAddress(accounts)}
    );
    mintableToken4 = await deployCappedMintableToken(accounts, MAX_SUPPLY);
    await mintableToken4.mint(
      getContributor(accounts, 4),
      2000,
      {from: getDefaultAddress(accounts)}
    );
  });

  it('should revert if the first transfer does not have enough allowance', async () => {
    await mintableToken1.approve(atomicSwap.address, 500, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 2)});

    await expectVMException(
      atomicSwap.swap([{
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 1000,
        sender2Amount: 1000
      }])
    );
  });

  it('should revert if the second transfer does not have enough allowance', async () => {
    await mintableToken1.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 500, {from: getContributor(accounts, 2)});

    await expectVMException(
      atomicSwap.swap([{
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 1000,
        sender2Amount: 1000
      }])
    );
  });

  it('should revert if the first transfer does not have enough balance', async () => {
    await mintableToken1.approve(atomicSwap.address, 2000, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 2)});

    await expectVMException(
      atomicSwap.swap([{
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 2000,
        sender2Amount: 1000
      }])
    );
  });

  it('should revert if the second transfer does not have enough balance', async () => {
    await mintableToken1.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 2000, {from: getContributor(accounts, 2)});

    await expectVMException(
      atomicSwap.swap([{
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 1000,
        sender2Amount: 2000
      }])
    );
  });

  it('should revert if any of the pairs reverts', async () => {
    await mintableToken1.approve(atomicSwap.address, 500, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 2)});
    await mintableToken3.approve(atomicSwap.address, 1500, {from: getContributor(accounts, 3)});
    await mintableToken4.approve(atomicSwap.address, 100, {from: getContributor(accounts, 4)});

    const pairs = [
      {
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 500,
        sender2Amount: 1000
      },
      {
        token1: mintableToken3.address,
        token2: mintableToken4.address,
        token1Sender: getContributor(accounts, 3),
        token2Sender: getContributor(accounts, 4),
        sender1Amount: 1500,
        sender2Amount: 2000
      }
    ];

    await expectVMException(atomicSwap.swap(pairs));
  });

  it('should correctly transfer the tokens between the two accounts', async () => {
    await mintableToken1.approve(atomicSwap.address, 500, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 2)});

    const pairs = [{
      token1: mintableToken1.address,
      token2: mintableToken2.address,
      token1Sender: getContributor(accounts, 1),
      token2Sender: getContributor(accounts, 2),
      sender1Amount: 500,
      sender2Amount: 1000
    }];

    await atomicSwap.swap(pairs);

    const token2Account1ExpectedBalance = 1000;
    const token1Account2ExpectedBalance = 500;
    const token1Account2Balance = await mintableToken1.balanceOf(getContributor(accounts, 2));
    const token2Account1Balance = await mintableToken2.balanceOf(getContributor(accounts, 1));

    expectBignumberEqual(token1Account2Balance, token1Account2ExpectedBalance);
    expectBignumberEqual(token2Account1Balance, token2Account1ExpectedBalance);
  });

  it('should correctly transfer to multiple pairs', async () => {
    await mintableToken1.approve(atomicSwap.address, 500, {from: getContributor(accounts, 1)});
    await mintableToken2.approve(atomicSwap.address, 1000, {from: getContributor(accounts, 2)});
    await mintableToken3.approve(atomicSwap.address, 1500, {from: getContributor(accounts, 3)});
    await mintableToken4.approve(atomicSwap.address, 2000, {from: getContributor(accounts, 4)});

    const pairs = [
      {
        token1: mintableToken1.address,
        token2: mintableToken2.address,
        token1Sender: getContributor(accounts, 1),
        token2Sender: getContributor(accounts, 2),
        sender1Amount: 500,
        sender2Amount: 1000
      },
      {
        token1: mintableToken3.address,
        token2: mintableToken4.address,
        token1Sender: getContributor(accounts, 3),
        token2Sender: getContributor(accounts, 4),
        sender1Amount: 1500,
        sender2Amount: 2000
      }
    ];

    await atomicSwap.swap(pairs);

    const token2Account1ExpectedBalance = 1000;
    const token1Account2ExpectedBalance = 500;
    const token4Account3ExpectedBalance = 2000;
    const token3Account4ExpectedBalance = 1500;
    const token1Account2Balance = await mintableToken1.balanceOf(getContributor(accounts, 2));
    const token2Account1Balance = await mintableToken2.balanceOf(getContributor(accounts, 1));
    const token3Account4Balance = await mintableToken3.balanceOf(getContributor(accounts, 4));
    const token4Account3Balance = await mintableToken4.balanceOf(getContributor(accounts, 3));

    expectBignumberEqual(token1Account2Balance, token1Account2ExpectedBalance);
    expectBignumberEqual(token2Account1Balance, token2Account1ExpectedBalance);
    expectBignumberEqual(token3Account4Balance, token3Account4ExpectedBalance);
    expectBignumberEqual(token4Account3Balance, token4Account3ExpectedBalance);
  });
});
