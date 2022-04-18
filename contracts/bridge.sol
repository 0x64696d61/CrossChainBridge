// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./myUSDC.sol";
import "hardhat/console.sol";

// Chains IDs:
//      Rinkeby 4,
//      Binance Smart Chain Testnet 97
contract Bridge {
    using ECDSA for bytes32;

    address private _backendAddress;
    uint8 private _fromChainId;
    uint8 private _toChainId;
    myUSDC private _token;

    mapping(bytes32 => bool) private messages;

    constructor(address TokenAddress, address backendAddress, uint8 fromChainId, uint8 toChainId) {
        _backendAddress = backendAddress;
        _fromChainId = fromChainId;
        _toChainId = toChainId;
        _token = myUSDC(TokenAddress);
    }

    event swapInitialized(
        address indexed toAddress,
        address indexed fromAddress,
        uint256 amount,
        uint8 fromChain,
        uint8 toChain
    );

    function swap(uint amount, address toAddress) external
    {
        _token.burnFrom(msg.sender, amount);
        emit swapInitialized(msg.sender, toAddress, amount, _fromChainId, _toChainId);
    }

    function redeem(uint seq, address sender, address toAddress, uint amount, uint8 fromChainId, uint8 toChainId, bytes memory signature) external
    {
        address signed_address;
        bytes32 message = (keccak256(abi.encodePacked(seq, sender, toAddress, amount, fromChainId, toChainId))).toEthSignedMessageHash();
        signed_address = message.recover(signature);

        require(signed_address == _backendAddress, "The signed is broken");
        require(messages[message] == false, "This swap already done");
        require(_fromChainId == toChainId && _toChainId == fromChainId, "Wrong chain");

        messages[message] = true;
        _token.mint(toAddress, amount);
    }
}