pragma solidity  ^0.5.7;

import "./CappedMintableToken.sol";


contract CappedMintableTokenFactory {
  function deploy(
    address tokenOwner,
    string memory name,
    string memory symbol,
    uint256 cap
    ) public returns(address)
  {
    CappedMintableToken newToken = new CappedMintableToken(
      name,
      symbol,
      cap
    );
    newToken.addMinter(tokenOwner);
    newToken.renounceMinter();
    newToken.transferOwnership(tokenOwner);

    return address(newToken);
  }
}
