// contracts/PolicyVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PolicyVault
 * @dev Stores execution constraints (max slippage, trade limit, daily limit) per user with kill switch.
 * Reference: Spectra.md §10.3
 */
contract PolicyVault is Ownable {
    struct Policy {
        uint256 maxTradeNotionalUsd;
        uint256 maxSlippageBps;
        uint256 dailyLimitUsd;
        uint256 currentDailyUsageUsd;
        uint256 lastTradeTimestamp;
        bool killSwitch;
    }

    mapping(address => Policy) public policies;

    event PolicyUpdated(address indexed user);
    event KillSwitchToggled(address indexed user, bool active);
    event TradeExecuted(address indexed user, uint256 amountUsd);

    constructor() Ownable(msg.sender) {}

    function setPolicy(
        address user,
        uint256 maxTrade,
        uint256 maxSlip,
        uint256 dailyLimit
    ) external onlyOwner {
        policies[user].maxTradeNotionalUsd = maxTrade;
        policies[user].maxSlippageBps = maxSlip;
        policies[user].dailyLimitUsd = dailyLimit;
        emit PolicyUpdated(user);
    }

    function checkTrade(
        address user,
        uint256 amountUsd,
        uint256 expectedSlippageBps
    ) external view returns (bool, string memory) {
        Policy memory p = policies[user];
        if (p.killSwitch) return (false, "KILL_SWITCH_ACTIVE");
        if (p.maxTradeNotionalUsd > 0 && amountUsd > p.maxTradeNotionalUsd) return (false, "MAX_TRADE_EXCEEDED");
        if (p.maxSlippageBps > 0 && expectedSlippageBps > p.maxSlippageBps) return (false, "MAX_SLIPPAGE_EXCEEDED");

        // Daily limit reset logic
        if (p.dailyLimitUsd > 0) {
            if (block.timestamp > p.lastTradeTimestamp + 1 days) {
                if (amountUsd > p.dailyLimitUsd) return (false, "DAILY_LIMIT_EXCEEDED");
            } else {
                if (p.currentDailyUsageUsd + amountUsd > p.dailyLimitUsd) return (false, "DAILY_LIMIT_EXCEEDED");
            }
        }
        return (true, "");
    }

    function recordTrade(address user, uint256 amountUsd) external onlyOwner {
        Policy storage p = policies[user];
        if (block.timestamp > p.lastTradeTimestamp + 1 days) {
            p.currentDailyUsageUsd = amountUsd;
        } else {
            p.currentDailyUsageUsd += amountUsd;
        }
        p.lastTradeTimestamp = block.timestamp;
        emit TradeExecuted(user, amountUsd);
    }

    function toggleKillSwitch(address user, bool active) external onlyOwner {
        policies[user].killSwitch = active;
        emit KillSwitchToggled(user, active);
    }
}
