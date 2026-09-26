// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockFacilitator
 * @notice Mock on-chain facilitator for b402 Shadow Gateway payment settlement.
 * Emits PaymentSettled and records payment settlements.
 * Reference: Spectra.md §9.3
 */
contract MockFacilitator is Ownable {
    event PaymentSettled(
        bytes32 indexed paymentId,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        string asset,
        uint256 timestamp
    );

    mapping(bytes32 => bool) public settledPayments;

    constructor() Ownable(msg.sender) {}

    function settlePayment(
        bytes32 paymentId,
        address payer,
        address payee,
        uint256 amount,
        string calldata asset
    ) external onlyOwner returns (bool) {
        require(!settledPayments[paymentId], "Payment already settled");
        require(payer != address(0), "Invalid payer");
        require(payee != address(0), "Invalid payee");
        require(amount > 0, "Amount must be greater than zero");

        settledPayments[paymentId] = true;

        emit PaymentSettled(paymentId, payer, payee, amount, asset, block.timestamp);
        return true;
    }

    function isSettled(bytes32 paymentId) external view returns (bool) {
        return settledPayments[paymentId];
    }
}
