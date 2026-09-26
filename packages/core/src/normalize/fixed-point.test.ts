// packages/core/src/normalize/fixed-point.test.ts
//
// Exhaustive tests for the fixed-point arithmetic library.
// Tests cover: basic operations, edge cases, zero handling,
// negative values, precision, and the empirical Spectra findings.

import { describe, it, expect } from "vitest";
import {
  PRECISION,
  BPS_PRECISION,
  mulFixed,
  divFixed,
  spreadBps,
  toPerShare,
  parseToFixed18,
  formatFixed18,
} from "./fixed-point.js";

describe("Constants", () => {
  it("PRECISION is 10^18", () => {
    expect(PRECISION).toBe(1_000_000_000_000_000_000n);
  });

  it("BPS_PRECISION is 10,000", () => {
    expect(BPS_PRECISION).toBe(10_000n);
  });
});

describe("mulFixed", () => {
  it("multiplies two whole numbers", () => {
    const a = 2n * PRECISION;
    const b = 3n * PRECISION;
    expect(mulFixed(a, b)).toBe(6n * PRECISION);
  });

  it("multiplies by one (identity)", () => {
    const a = 42n * PRECISION;
    expect(mulFixed(a, PRECISION)).toBe(a);
  });

  it("multiplies by zero", () => {
    expect(mulFixed(42n * PRECISION, 0n)).toBe(0n);
    expect(mulFixed(0n, 42n * PRECISION)).toBe(0n);
  });

  it("handles fractional multiplication", () => {
    // 1.5 * 2.0 = 3.0
    const a = parseToFixed18("1.5");
    const b = 2n * PRECISION;
    expect(mulFixed(a, b)).toBe(3n * PRECISION);
  });

  it("handles two fractional values", () => {
    // 0.5 * 0.5 = 0.25
    const a = parseToFixed18("0.5");
    const b = parseToFixed18("0.5");
    expect(mulFixed(a, b)).toBe(parseToFixed18("0.25"));
  });
});

describe("divFixed", () => {
  it("divides two whole numbers", () => {
    const a = 6n * PRECISION;
    const b = 3n * PRECISION;
    expect(divFixed(a, b)).toBe(2n * PRECISION);
  });

  it("divides by one (identity)", () => {
    const a = 42n * PRECISION;
    expect(divFixed(a, PRECISION)).toBe(a);
  });

  it("throws on division by zero", () => {
    expect(() => divFixed(42n * PRECISION, 0n)).toThrow("Division by zero");
  });

  it("handles fractional result", () => {
    // 1 / 3 ≈ 0.333...
    const result = divFixed(PRECISION, 3n * PRECISION);
    // Should be approximately 0.333... with 18 decimal precision
    const expected = 333_333_333_333_333_333n;
    expect(result).toBe(expected);
  });

  it("divides zero by any number", () => {
    expect(divFixed(0n, 42n * PRECISION)).toBe(0n);
  });
});

describe("spreadBps", () => {
  it("returns 0 when numerator equals denominator", () => {
    const price = 100n * PRECISION;
    expect(spreadBps(price, price)).toBe(0n);
  });

  it("returns positive bps for premium", () => {
    // 101 / 100 = 1% = 100 bps
    const num = 101n * PRECISION;
    const den = 100n * PRECISION;
    expect(spreadBps(num, den)).toBe(100n);
  });

  it("returns negative bps for discount", () => {
    // 99 / 100 = -1% = -100 bps
    const num = 99n * PRECISION;
    const den = 100n * PRECISION;
    expect(spreadBps(num, den)).toBe(-100n);
  });

  it("computes the empirical AAPL spread of ~33.76 bps", () => {
    // Simulating the empirical finding from Spectra.md §2.2
    // tokenPrice / tokenToShareRatio gives perSharePrice
    // The spread between tokenPrice and referencePrice is 33.76 bps
    const tokenPrice = parseToFixed18("335.02");
    const sharesMultiplier = parseToFixed18("1.003376073740221058");
    const perSharePrice = divFixed(tokenPrice, sharesMultiplier);

    // The spread between tokenPrice and perSharePrice should be ~33.76 bps
    const spread = spreadBps(tokenPrice, perSharePrice);
    // Should be approximately 33 bps (integer truncation)
    expect(spread).toBeGreaterThanOrEqual(33n);
    expect(spread).toBeLessThanOrEqual(34n);
  });

  it("throws on zero denominator", () => {
    expect(() => spreadBps(100n * PRECISION, 0n)).toThrow("Division by zero");
  });
});

describe("toPerShare", () => {
  it("converts token price to per-share price", () => {
    const tokenPrice = parseToFixed18("335.02");
    const ratio = parseToFixed18("1.003376073740221058");
    const perShare = toPerShare(tokenPrice, ratio);

    // Per-share should be slightly less than token price
    expect(perShare).toBeLessThan(tokenPrice);
    expect(perShare).toBeGreaterThan(0n);
  });

  it("returns exact value when ratio is 1.0", () => {
    const price = 100n * PRECISION;
    expect(toPerShare(price, PRECISION)).toBe(price);
  });

  it("throws when ratio is 0", () => {
    expect(() => toPerShare(100n * PRECISION, 0n)).toThrow("Division by zero");
  });
});

describe("parseToFixed18", () => {
  it("parses a whole number", () => {
    expect(parseToFixed18("335")).toBe(335n * PRECISION);
  });

  it("parses a decimal number", () => {
    expect(parseToFixed18("335.02")).toBe(
      335n * PRECISION + 20_000_000_000_000_000n,
    );
  });

  it("parses zero", () => {
    expect(parseToFixed18("0")).toBe(0n);
    expect(parseToFixed18("0.0")).toBe(0n);
  });

  it("parses 1.0", () => {
    expect(parseToFixed18("1.0")).toBe(PRECISION);
  });

  it("parses high-precision decimal", () => {
    const result = parseToFixed18("1.003376073740221058");
    expect(result).toBe(1_003_376_073_740_221_058n);
  });

  it("handles negative values", () => {
    const result = parseToFixed18("-1.5");
    expect(result).toBe(-(PRECISION + PRECISION / 2n));
  });

  it("truncates beyond 18 decimals (no rounding)", () => {
    // 19 decimals — should truncate to 18
    const result = parseToFixed18("1.0000000000000000001");
    expect(result).toBe(PRECISION); // Truncated
  });

  it("pads short decimals", () => {
    const result = parseToFixed18("1.5");
    expect(result).toBe(parseToFixed18("1.500000000000000000"));
  });

  it("throws on empty string", () => {
    expect(() => parseToFixed18("")).toThrow("Empty string");
  });

  it("throws on invalid format", () => {
    expect(() => parseToFixed18("1.2.3")).toThrow("Invalid decimal");
  });
});

describe("formatFixed18", () => {
  it("formats a whole number", () => {
    expect(formatFixed18(335n * PRECISION)).toBe(
      "335.000000000000000000",
    );
  });

  it("formats a decimal number", () => {
    const value = parseToFixed18("335.02");
    expect(formatFixed18(value)).toBe("335.020000000000000000");
  });

  it("formats zero", () => {
    expect(formatFixed18(0n)).toBe("0.000000000000000000");
  });

  it("formats negative values", () => {
    const value = parseToFixed18("-1.5");
    expect(formatFixed18(value)).toBe("-1.500000000000000000");
  });

  it("round-trips with parseToFixed18", () => {
    const values = ["0", "1", "335.02", "1.003376073740221058", "999999.999999999999999999"];
    for (const v of values) {
      const parsed = parseToFixed18(v);
      const formatted = formatFixed18(parsed);
      const reparsed = parseToFixed18(formatted);
      expect(reparsed).toBe(parsed);
    }
  });
});

describe("Empirical validation", () => {
  it("reproduces the AAPL unit-conversion proof from Spectra.md §2.2", () => {
    // From the empirical test: referencePrice = tokenPrice / tokenToShareRatio
    // tokenToShareRatio (sharesMultiplier) = 1.003376073740221058
    // The spread between onchain and ref is constant 33.76 bps with zero variance

    const tokenPrice = parseToFixed18("335.02");
    const sharesMultiplier = parseToFixed18("1.003376073740221058");

    // Compute per-share price (this IS the referencePrice)
    const referencePrice = toPerShare(tokenPrice, sharesMultiplier);

    // Verify the relationship: tokenPrice * 1.0 / sharesMultiplier = referencePrice
    // The residual should be negligible
    const reconstructed = mulFixed(referencePrice, sharesMultiplier);
    const residual = tokenPrice > reconstructed
      ? tokenPrice - reconstructed
      : reconstructed - tokenPrice;

    // Residual should be less than 1 unit (precision loss from integer division)
    expect(residual).toBeLessThanOrEqual(1n);

    // The spread between tokenPrice and referencePrice should be constant ~33.76 bps
    const spread = spreadBps(tokenPrice, referencePrice);
    expect(spread).toBe(33n); // Integer truncation of 33.76
  });
});
