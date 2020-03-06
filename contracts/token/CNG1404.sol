pragma solidity  ^0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./CappedMintableToken.sol";
import "../common/WhitelistOracle.sol";
import "../common/SignatureVerifier.sol";
import "./ICNG1404.sol";


contract CNG1404 is CappedMintableToken, ICNG1404, SignatureVerifier {
  using Address for address;
  
  WhitelistOracle public whitelistOracle;
  uint8 public constant SUCCESS_CODE = 0;
  uint8 public constant WHITELIST_CODE = 1;

  mapping (uint256 => string) private _restrictionMessages;
  mapping(bytes16 => bool) private _usedNonces;

  modifier notRestricted (address from, address to, uint256 value) {
    uint8 restrictionCode = detectTransferRestriction(from, to, value);
    require(
      restrictionCode == SUCCESS_CODE,
      messageForTransferRestriction(restrictionCode)
    );
    _;
  }

  constructor(
    string memory name,
    string memory symbol,
    uint256 cap,
    address _whitelistOracle
  )  
    CappedMintableToken(name, symbol, cap)
    public
  {
    require(address(_whitelistOracle).isContract(), "Whitelist Oracle should be a contract");
    
    whitelistOracle = WhitelistOracle(_whitelistOracle);
    _restrictionMessages[0] = "SUCCESS";
    _restrictionMessages[1] = "Address is not whitelisted";
  }

  function detectTransferRestriction (address from, address to, uint256 value)
    public
    view
    returns (uint8 restrictionCode)
  {
    bool isWhitelistedAddress = whitelistOracle.isWhitelisted(to);
    if (isWhitelistedAddress) {
      restrictionCode = SUCCESS_CODE;
    }
    else {
      restrictionCode = WHITELIST_CODE;
    }
  }
        
  function messageForTransferRestriction (uint8 restrictionCode)
    public
    view
    returns (string memory message)
  {
    message = _restrictionMessages[restrictionCode];
  }

  function transfer (address to, uint256 value)	
    public	
    notRestricted(address(msg.sender), to, value)	
    returns (bool success)	
  {	
    success = super.transfer(to, value);	
  }

  function transferFrom (address from, address to, uint256 value)	
    public	
    notRestricted(from, to, value)	
    returns (bool success)	
  {	
    success = super.transferFrom(from, to, value);	
  }

  function mint (
    address to,
    uint256 value,
    bytes memory sig,
    bytes16 nonce,
    string memory message
  ) public
    notRestricted(address(this), to, value)
    returns (bool success)
  {
    require(!_usedNonces[nonce], "Distribution nonce has been used before");
    _usedNonces[nonce] = true;
    require(
      verifySignature(
        sig,
        nonce,
        message
      ),
      "Signature could not be verified"
    );
    success = super.mint(to, value);
  }
}
