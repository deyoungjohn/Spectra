// contracts/ReceiptRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReceiptRegistry
 * @dev Anchors agent decisions with cryptographic hashes for transparent on-chain auditability.
 * Reference: Spectra.md §10.4
 */
contract ReceiptRegistry is Ownable {
    struct Receipt {
        bytes32 decisionHash;
        bytes32 simulationHash;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 expectedAmountOut;
        uint256 actualAmountOut;
        string signalType;
        uint256 timestamp;
    }

    mapping(address => mapping(uint256 => Receipt)) public receipts;
    mapping(address => uint256) public receiptCounts;

    event ReceiptRecorded(
        address indexed user,
        uint256 indexed receiptId,
        bytes32 decisionHash
    );

    constructor() Ownable(msg.sender) {}

    function recordReceipt(
        address user,
        bytes32 decisionHash,
        bytes32 simulationHash,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOut,
        uint256 actualAmountOut,
        string calldata signalType
    ) external onlyOwner returns (uint256) {
        uint256 id = receiptCounts[user]++;
        receipts[user][id] = Receipt({
            decisionHash: decisionHash,
            simulationHash: simulationHash,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            expectedAmountOut: expectedAmountOut,
            actualAmountOut: actualAmountOut,
            signalType: signalType,
            timestamp: block.timestamp
        });

        emit ReceiptRecorded(user, id, decisionHash);
        return id;
    }

    function getReceipt(address user, uint256 receiptId) external view returns (Receipt memory) {
        return receipts[user][receiptId];
    }
}
