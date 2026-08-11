/**
 * ZAR money handling. Money is integer cents everywhere inside the app; strings
 * are parsed at the edge (form input) and formatted at the edge (render).
 */

/** A plain space, per the house format: R1 299.00 */
const GROUP_SEPARATOR = " ";

/**
 * Every space-ish character a pasted price might contain. JavaScript's `\s`
 * already covers U+00A0 and U+202F, which is what a copied price tag carries.
 */
const SPACE_CHARS = /\s/g;

export type PriceParse = { ok: true; cents: number } | { ok: false };

/**
 * Accepts anything a person might plausibly type or paste for a rand amount:
 * `1899`, `R 1299`, `1,299.50`, `R1 299,50`, `1.299,50`, `1299.5`.
 *
 * A comma is a decimal separator only when it is followed by exactly two digits
 * at the very end of the string; otherwise it groups thousands.
 */
export function parsePriceToCents(raw: string): PriceParse {
  if (typeof raw !== "string") return { ok: false };

  let s = raw.replace(SPACE_CHARS, "");
  if (s === "") return { ok: false };

  // Currency marker, however it was typed.
  s = s.replace(/^(zar|r)/i, "");
  if (s === "") return { ok: false };

  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("-")) return { ok: false }; // a price is > 0

  const commaIsDecimal = /,\d{2}$/.test(s);
  if (commaIsDecimal) {
    // Dots left standing must have been grouping separators: 1.299,50
    s = s.replace(/\./g, "");
    const cut = s.lastIndexOf(",");
    s = s.slice(0, cut).replace(/,/g, "") + "." + s.slice(cut + 1);
  } else {
    s = s.replace(/,/g, "");
  }

  const m = /^(\d+)(?:\.(\d+))?$/.exec(s);
  if (!m) return { ok: false };

  const rands = Number(m[1]);
  const fraction = m[2] ? Number(`0.${m[2]}`) : 0;
  const cents = rands * 100 + Math.round(fraction * 100);

  if (!Number.isSafeInteger(cents) || cents <= 0) return { ok: false };
  return { ok: true, cents };
}

/** `1234567` -> `1 234 567` */
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}

export type FormatOptions = {
  /** Drop the leading `R`. Default false. */
  bare?: boolean;
  /** Number of decimals. Default 2. */
  decimals?: 0 | 2;
};

/**
 * Formats cents as rand. Accepts a float (computed costs are floats in cents)
 * and rounds at this, the only, rounding point.
 */
export function formatCents(cents: number, options: FormatOptions = {}): string {
  const { bare = false, decimals = 2 } = options;

  if (!Number.isFinite(cents)) return bare ? "—" : "R—";

  const negative = cents < 0;
  const scaled = Math.round(Math.abs(cents) / (decimals === 0 ? 100 : 1));
  const text =
    decimals === 0
      ? groupDigits(String(scaled))
      : `${groupDigits(String(Math.floor(scaled / 100)))}.${String(scaled % 100).padStart(2, "0")}`;

  return `${negative ? "-" : ""}${bare ? "" : "R"}${text}`;
}

/** `R1 899` — for places where the cents are noise, like the whole-rand tiles. */
export function formatRands(cents: number, options: Omit<FormatOptions, "decimals"> = {}): string {
  return formatCents(cents, { ...options, decimals: 0 });
}

/** Whole numbers with the same grouping as money, for day counts. */
export function formatCount(n: number): string {
  return groupDigits(String(Math.round(n)));
}
