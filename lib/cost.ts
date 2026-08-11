/**
 * Cost-of-ownership arithmetic. Pure functions, no I/O, no date library.
 *
 * Dates are 'YYYY-MM-DD' strings treated as UTC midnights, so day arithmetic is
 * exact integer division and never gets bent by a timezone or a DST boundary.
 *
 * Months are averaged, never calendar months — an item's cost per month must not
 * jump every February.
 */

export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30.4375; // 365.25 / 12
export const DAYS_PER_YEAR = 365.25;

/** Horizons shown in the projection table, in years. */
export const PROJECTION_YEARS = [1, 2, 3, 5, 10] as const;

const MS_PER_DAY = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for a real calendar date in 'YYYY-MM-DD' form. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [, y, mo, d] = m;
  const ms = Date.UTC(Number(y), Number(mo) - 1, Number(d));
  const back = new Date(ms);
  return (
    back.getUTCFullYear() === Number(y) &&
    back.getUTCMonth() === Number(mo) - 1 &&
    back.getUTCDate() === Number(d)
  );
}

/** UTC midnight in ms for a 'YYYY-MM-DD' string. */
export function isoToUtcMs(value: string): number {
  if (!isIsoDate(value)) throw new RangeError(`Not a YYYY-MM-DD date: ${value}`);
  const m = ISO_DATE.exec(value)!;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Whole days from `from` to `to`. Negative when `to` precedes `from`. */
export function utcDaysBetween(from: string, to: string): number {
  return Math.round((isoToUtcMs(to) - isoToUtcMs(from)) / MS_PER_DAY);
}

/** Today on the machine's own calendar, as 'YYYY-MM-DD'. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add days to an ISO date, staying in UTC. */
export function addDays(date: string, days: number): string {
  return new Date(isoToUtcMs(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Days of ownership. Day one counts as one day, so nothing ever divides by zero.
 * A retired item's clock stops at `endedOn` and the answer stops moving.
 */
export function daysOwned(purchasedOn: string, endedOn: string | null, today: string): number {
  const end = endedOn ?? today;
  return Math.max(1, utcDaysBetween(purchasedOn, end) + 1);
}

export type Costs = {
  /** Real days of ownership — what the screen reports. */
  days: number;
  /** Days used as the divisor, floored at one month. See `costsFromDays`. */
  effectiveDays: number;
  perDay: number;
  perWeek: number;
  perMonth: number;
  perYear: number;
};

/**
 * All three cadences from a price and a number of days. Cents, as floats.
 *
 * The divisor is floored at one averaged month. Without that floor, something
 * bought this morning divides its whole price by one day and reports a monthly
 * cost thirty times what you paid — arithmetically true, and useless. Flooring
 * says the honest thing instead: in its first month, a thing has cost you its
 * price. From day 31 the real figure takes over and starts falling.
 *
 * The floor keeps the three cadences exact multiples of each other, and leaves
 * anything owned longer than a month completely untouched.
 */
export function costsFromDays(priceCents: number, days: number): Costs {
  const realDays = Math.max(1, days);
  const effectiveDays = Math.max(realDays, DAYS_PER_MONTH);
  const perDay = priceCents / effectiveDays;
  return {
    days: realDays,
    effectiveDays,
    perDay,
    perWeek: perDay * DAYS_PER_WEEK,
    perMonth: perDay * DAYS_PER_MONTH,
    perYear: perDay * DAYS_PER_YEAR,
  };
}

/** All three cadences for an item as of `today`. */
export function costsFor(
  item: { price_cents: number; purchased_on: string; ended_on: string | null },
  today: string,
): Costs {
  return costsFromDays(item.price_cents, daysOwned(item.purchased_on, item.ended_on, today));
}

/** What the monthly cost becomes if you keep it for N years. */
export function projectedPerMonth(priceCents: number, years: number): number {
  return (priceCents / (years * DAYS_PER_YEAR)) * DAYS_PER_MONTH;
}

/** Past this, the divisor is real time owned rather than the one-month floor. */
export const SETTLING_DAYS = 31;

/** Under a month of ownership: the monthly figure is still just the price. */
export function isSettling(days: number): boolean {
  return days < SETTLING_DAYS;
}

/** A year in, the figure has settled enough to earn the green rule. */
export function isSettled(days: number): boolean {
  return days >= DAYS_PER_YEAR;
}

export type ProjectionRow = {
  years: number;
  perMonth: number;
  /** Already owned this long — the projection is history, not a forecast. */
  reached: boolean;
  /** The calendar date the horizon falls on, when a start date is known. */
  on: string | null;
};

/**
 * `from` is the purchase date for something owned, or today for something on the
 * want list — either way, the date each horizon actually lands on.
 */
export function projectionRows(
  priceCents: number,
  days: number,
  from?: string,
): ProjectionRow[] {
  return PROJECTION_YEARS.map((years) => ({
    years,
    perMonth: projectedPerMonth(priceCents, years),
    reached: days >= years * DAYS_PER_YEAR,
    on: from ? addDays(from, Math.round(years * DAYS_PER_YEAR)) : null,
  }));
}

/** Whole months owned, on the same averaged-month basis as every other figure. */
export function monthsOwned(days: number): number {
  return days / DAYS_PER_MONTH;
}
