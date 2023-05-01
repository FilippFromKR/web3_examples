pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Mint is ERC721, Ownable {
    uint256 private _tokenIds;

    string public uriPrefix = "";
    string public uriSuffix = ".json";

    bool public paused;
    uint256 public cost = 0.01 ether;
    uint256 public maxSupply;


    constructor(string memory _uriPrefix, uint256 _maxSupply) ERC721("LITS_NFT", "LITS") {
        uriPrefix = _uriPrefix;
        maxSupply = _maxSupply;

    }
    modifier validateSupply(uint256 mint_amount)
    {
        require(_tokenIds < maxSupply, "Max supply reached");
        require(mint_amount > 0, "Mint 0");

        _;
    }


    function setPaused(bool _state) public onlyOwner {
        paused = _state;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }

    function mintForAddress(uint256 _mintAmount, address _receiver)
    public
    onlyOwner
    {
        _mint_loop(_mintAmount, _receiver);
    }

    // function should be payable. Shadowed for testing purposes
    function mint(uint256 _mintAmount)
    public
        //    payable
    {
        require(!paused, "The contract is paused!");
        //        require(msg.value >= cost * _mintAmount, "Insufficient funds!");

        _mint_loop(_mintAmount, msg.sender);


    }

    function _mint_loop(uint256 _mintAmount, address _receiver) internal validateSupply(_mintAmount)
    {
        for (uint8 i = 0; i <= _mintAmount; i++)
        {
            _tokenIds += 1;
            _safeMint(msg.sender, _tokenIds);
        }
    }

    function tokenURI(uint256 _tokenId)
    public
    view
    virtual
    override
    returns (string memory)
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        return
        bytes(uriPrefix).length > 0
        ? string(
            abi.encodePacked(
                uriPrefix,
                Strings.toString(_tokenId),
                uriSuffix
            )
        )
        : "";
    }


    function withdraw() public onlyOwner {
        (bool os,) = payable(owner()).call{value : address(this).balance}("");
        require(os);
    }
}
