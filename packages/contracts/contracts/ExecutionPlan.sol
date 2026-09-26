// contracts/ExecutionPlan.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ExecutionPlanVerifier
 * @dev Verifies EIP-712 structured cryptographic signatures on execution plans
 * finalized by the backend Strategy Conflict Resolution Coordinator.
 * Reference: Spectra.md §10.8
 */
contract ExecutionPlanVerifier is EIP712, Ownable {
    bytes32 public constant PLAN_TYPEHASH =
        keccak256("ExecutionPlan(address user,address targetToken,uint256 amountUsd,uint256 nonce,uint256 deadline)");

    address public backendSigner;

    event BackendSignerUpdated(address indexed previousSigner, address indexed newSigner);

    constructor(address _signer) EIP712("Spectra", "1") Ownable(msg.sender) {
        require(_signer != address(0), "Invalid signer");
        backendSigner = _signer;
    }

    function setBackendSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer");
        emit BackendSignerUpdated(backendSigner, _signer);
        backendSigner = _signer;
    }

    function verifyPlan(
        address user,
        address targetToken,
        uint256 amountUsd,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public view returns (bool) {
        require(block.timestamp <= deadline, "Plan expired");

        bytes32 structHash = keccak256(
            abi.encode(
                PLAN_TYPEHASH,
                user,
                targetToken,
                amountUsd,
                nonce,
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = ECDSA.recover(digest, signature);

        return recoveredSigner == backendSigner;
    }
}
