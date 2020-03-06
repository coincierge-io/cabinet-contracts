pragma solidity  ^0.5.7;

import "./CNG1404.sol";


contract CNG1404TokenFactory {
  function deploy(
    address tokenOwner,
    string memory name,
    string memory symbol,
    uint256 cap,
    address whitelistOracle
    ) public returns(address)
  {
    CNG1404 newToken = new CNG1404(
      name,
      symbol,
      cap,
      whitelistOracle
    );
    newToken.addMinter(tokenOwner);
    newToken.renounceMinter();
    newToken.addSigner(tokenOwner);
    newToken.renounceSigner();
    newToken.transferOwnership(tokenOwner);
    return address(newToken);
  }
}
