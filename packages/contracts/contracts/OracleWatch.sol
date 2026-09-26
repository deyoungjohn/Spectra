// contracts/OracleWatch.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FixedPointMath.sol";

/**
 * @title OracleWatch
 * @dev Records historical perSharePrice vs external TradFi anchor to log true Oracle Divergence.
 * Reference: Spectra.md §10.2
 */
contract OracleWatch is Ownable {
    using FixedPointMath for uint256;

    event DivergenceRecorded(
        string indexed ticker,
        uint256 perSharePrice,
        uint256 tradfiPrice,
        uint256 timestamp,
        int256 divergenceBps
    );

    struct Snapshot {
        uint256 perSharePrice;
        uint256 tradfiPrice;
        uint256 timestamp;
        int256 divergenceBps;
    }

    mapping(string => Snapshot[]) private history;

    constructor() Ownable(msg.sender) {}

    function recordSnapshot(
        string calldata ticker,
        uint256 perSharePrice,
        uint256 tradfiPrice
    ) external onlyOwner {
        require(tradfiPrice > 0, "TradFi price zero");

        // Calculate divergence in bps using fixed-point math
        uint256 ratio = (perSharePrice * FixedPointMath.BPS_PRECISION) / tradfiPrice;
        int256 divergenceBps = int256(ratio) - int256(FixedPointMath.BPS_PRECISION);

        history[ticker].push(Snapshot({
            perSharePrice: perSharePrice,
            tradfiPrice: tradfiPrice,
            timestamp: block.timestamp,
            divergenceBps: divergenceBps
        }));

        // Prevent unbounded array growth
        if (history[ticker].length > 1000) {
            _pruneHistory(ticker);
        }

        emit DivergenceRecorded(ticker, perSharePrice, tradfiPrice, block.timestamp, divergenceBps);
    }

    function _pruneHistory(string memory ticker) internal {
        uint256 length = history[ticker].length;
        uint256 trimSize = 500;
        for (uint256 i = 0; i < length - trimSize; i++) {
            history[ticker][i] = history[ticker][i + trimSize];
        }
        for (uint256 i = 0; i < trimSize; i++) {
            history[ticker].pop();
        }
    }

    function getHistory(string calldata ticker) external view returns (Snapshot[] memory) {
        return history[ticker];
    }
}
