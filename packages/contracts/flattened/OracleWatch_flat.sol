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


// File contracts/OracleWatch.sol

// contracts/OracleWatch.sol
// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;


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
