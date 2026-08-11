import { describe, expect, it } from "vitest";

import { formatCents, formatCount, formatRands, parsePriceToCents } from "../lib/money";

function cents(input: string): number | null {
  const r = parsePriceToCents(input);
  return r.ok ? r.cents : null;
}

const NBSP = "\u00A0";
const NARROW_NBSP = "\u202F";

describe("parsePriceToCents", () => {
  it("accepts the four formats a person actually types", () => {
    // The acceptance case: all four save, and the first two are the same amount.
    expect(cents("R1 299,50")).toBe(129950);
    expect(cents("1,299.50")).toBe(129950);
    expect(cents("1299.5")).toBe(129950);
    expect(cents("R 1299")).toBe(129900);
  });

  it("treats a trailing comma-two-digits as a decimal separator", () => {
    expect(cents("12,50")).toBe(1250);
    expect(cents("1299,50")).toBe(129950);
    expect(cents("1 299,50")).toBe(129950);
  });

  it("treats any other comma as a thousands separator", () => {
    expect(cents("1,299")).toBe(129900);
    expect(cents("1,234,567")).toBe(123456700);
    expect(cents("1,299.5")).toBe(129950);
  });

  it("handles the European dot-thousands form", () => {
    expect(cents("1.299,50")).toBe(129950);
    expect(cents("R1.299,50")).toBe(129950);
  });

  it("copes with the invisible spaces a copied price tag carries", () => {
    expect(cents(`R${NBSP}1${NBSP}899.00`)).toBe(189900);
    expect(cents(`R${NARROW_NBSP}1${NARROW_NBSP}899`)).toBe(189900);
    expect(cents("\t1899\n")).toBe(189900);
  });

  it("strips the currency marker however it is written", () => {
    expect(cents("R1899")).toBe(189900);
    expect(cents("r1899")).toBe(189900);
    expect(cents("ZAR 1899")).toBe(189900);
  });

  it("rounds beyond two decimals to the nearest cent", () => {
    expect(cents("10.005")).toBe(1001);
    expect(cents("10.004")).toBe(1000);
    expect(cents("9.999")).toBe(1000);
  });

  it("does not lose a cent to float drift", () => {
    expect(cents("1899.29")).toBe(189929);
    expect(cents("0.07")).toBe(7);
    expect(cents("70.07")).toBe(7007);
  });

  it("rejects anything that is not a positive amount", () => {
    expect(cents("")).toBeNull();
    expect(cents("   ")).toBeNull();
    expect(cents("R")).toBeNull();
    expect(cents("free")).toBeNull();
    expect(cents("1299kr")).toBeNull();
    expect(cents("12.34.56")).toBeNull();
    expect(cents("-1299")).toBeNull();
    expect(cents("0")).toBeNull();
    expect(cents("0.00")).toBeNull();
    expect(cents("1299.")).toBeNull();
  });
});

describe("formatCents", () => {
  it("uses a space for thousands and always two decimals", () => {
    expect(formatCents(129900)).toBe("R1 299.00");
    expect(formatCents(129950)).toBe("R1 299.50");
    expect(formatCents(700)).toBe("R7.00");
    expect(formatCents(123456789)).toBe("R1 234 567.89");
  });

  it("rounds computed float cents at render time only", () => {
    expect(formatCents(8947.53)).toBe("R89.48");
    expect(formatCents(8947.49)).toBe("R89.47");
  });

  it("can drop the symbol or the cents", () => {
    expect(formatCents(129900, { bare: true })).toBe("1 299.00");
    expect(formatRands(1049800)).toBe("R10 498");
    expect(formatRands(129950)).toBe("R1 300"); // rounds, not truncates
  });

  it("survives a non-finite figure without printing NaN", () => {
    expect(formatCents(Number.NaN)).toBe("R—");
    expect(formatCents(Number.POSITIVE_INFINITY)).toBe("R—");
  });
});

describe("formatCount", () => {
  it("groups day counts the same way as money", () => {
    expect(formatCount(646)).toBe("646");
    expect(formatCount(1516)).toBe("1 516");
    expect(formatCount(10000)).toBe("10 000");
  });
});
