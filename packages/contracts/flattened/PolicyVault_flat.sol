// Sources flattened with hardhat v2.29.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.6.1

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File contracts/PolicyVault.sol

// contracts/PolicyVault.sol
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;

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
