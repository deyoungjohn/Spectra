// packages/core/src/normalize/fixed-point.ts
//
// 18-decimal fixed-point arithmetic for financial calculations.
// All prices, spreads, and ratios MUST use these functions.
// Never use floating-point division on financial values.
//
// Reference: Spectra.md §5.2.1

/** 18-decimal precision constant */
export const PRECISION = 10n ** 18n;

/** Basis points precision (10,000 bps = 100%) */
export const BPS_PRECISION = 10_000n;

/**
 * Multiply two 18-decimal fixed-point BigInts.
 *
 * @example mulFixed(2n * PRECISION, 3n * PRECISION) === 6n * PRECISION
 */
export function mulFixed(a: bigint, b: bigint): bigint {
  return (a * b) / PRECISION;
}

/**
 * Divide two 18-decimal fixed-point BigInts.
 *
 * @throws {Error} Division by zero
 * @example divFixed(6n * PRECISION, 3n * PRECISION) === 2n * PRECISION
 */
export function divFixed(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new Error("Division by zero");
  return (a * PRECISION) / b;
}

/**
 * Compute spread in integer basis points.
 *
 * Returns `(numerator / denominator - 1) * 10000` as a bigint.
 * Positive = numerator is higher. Negative = numerator is lower.
 *
 * @throws {Error} Division by zero
 */
export function spreadBps(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new Error("Division by zero");
  const ratio = (numerator * BPS_PRECISION) / denominator;
  return ratio - BPS_PRECISION;
}

/**
 * Convert per-token price to per-share price.
 *
 * This is the core empirical finding:
 *   perSharePrice = tokenPrice / tokenToShareRatio
 *
 * @throws {Error} Division by zero
 */
export function toPerShare(
  tokenPrice: bigint,
  tokenToShareRatio: bigint,
): bigint {
  return divFixed(tokenPrice, tokenToShareRatio);
}

/**
 * Parse a decimal string like "335.02" into an 18-decimal BigInt.
 *
 * @example parseToFixed18("335.02") === 335020000000000000000n
 */
export function parseToFixed18(value: string): bigint {
  const trimmed = value.trim();
  if (trimmed === "") throw new Error("Empty string");

  const negative = trimmed.startsWith("-");
  const abs = negative ? trimmed.slice(1) : trimmed;
  const parts = abs.split(".");

  if (parts.length > 2) throw new Error(`Invalid decimal: ${value}`);

  const whole = BigInt(parts[0]!) * PRECISION;

  if (parts.length === 1) return negative ? -whole : whole;

  const fracStr = parts[1]!;
  if (fracStr.length > 18) {
    // Truncate to 18 decimals (no rounding)
    const truncated = fracStr.slice(0, 18);
    const frac = BigInt(truncated);
    const result = whole + frac;
    return negative ? -result : result;
  }

  const padded = fracStr.padEnd(18, "0");
  const frac = BigInt(padded);
  const result = whole + frac;
  return negative ? -result : result;
}

/**
 * Format an 18-decimal BigInt to a human-readable string.
 *
 * @example formatFixed18(335020000000000000000n) === "335.020000000000000000"
 */
export function formatFixed18(value: bigint): string {
  const abs = value < 0n ? -value : value;
  const sign = value < 0n ? "-" : "";
  const whole = abs / PRECISION;
  const frac = abs % PRECISION;
  return `${sign}${whole}.${frac.toString().padStart(18, "0")}`;
}
