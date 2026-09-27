// Sources flattened with hardhat v2.29.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/FixedPointMath.sol

// contracts/FixedPointMath.sol
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FixedPointMath
 * @dev High-precision 18-decimal fixed-point math library matching @spectra/core.
 * Reference: Spectra.md §10.7
 */
library FixedPointMath {
    uint256 internal constant PRECISION = 1e18;
    uint256 internal constant BPS_PRECISION = 10000;

    function mulFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * b) / PRECISION;
    }

    function divFixed(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "Division by zero");
        return (a * PRECISION) / b;
    }
}
