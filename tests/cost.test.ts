import { describe, expect, it } from "vitest";

import {
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  addDays,
  costsFor,
  costsFromDays,
  daysOwned,
  isIsoDate,
  isSettled,
  isSettling,
  projectedPerMonth,
  projectionRows,
  todayIso,
  utcDaysBetween,
} from "../lib/cost";

const TODAY = "2026-08-11";

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2026-08-11")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true); // leap year
    expect(isIsoDate("2026-02-29")).toBe(false); // not one
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-04-31")).toBe(false);
    expect(isIsoDate("2026-8-11")).toBe(false);
    expect(isIsoDate("11/08/2026")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });
});

describe("utcDaysBetween", () => {
  it("counts whole days across month and year boundaries", () => {
    expect(utcDaysBetween("2026-08-11", "2026-08-11")).toBe(0);
    expect(utcDaysBetween("2026-08-11", "2026-08-12")).toBe(1);
    expect(utcDaysBetween("2026-07-31", "2026-08-01")).toBe(1);
    expect(utcDaysBetween("2025-12-31", "2026-01-01")).toBe(1);
    expect(utcDaysBetween("2024-11-03", "2026-08-11")).toBe(646);
    expect(utcDaysBetween("2022-06-18", "2026-08-11")).toBe(1515);
  });

  it("counts the leap day", () => {
    expect(utcDaysBetween("2024-02-28", "2024-03-01")).toBe(2);
    expect(utcDaysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(utcDaysBetween("2024-01-01", "2025-01-01")).toBe(366);
    expect(utcDaysBetween("2025-01-01", "2026-01-01")).toBe(365);
  });

  it("is unmoved by daylight-saving shifts in the host timezone", () => {
    // Southern-hemisphere and northern DST switch weekends alike: UTC midnights
    // are exactly 86 400 000 ms apart, always.
    for (const [from, to] of [
      ["2026-03-28", "2026-03-29"],
      ["2026-10-24", "2026-10-25"],
      ["2026-11-07", "2026-11-08"],
    ] as const) {
      expect(utcDaysBetween(from, to)).toBe(1);
    }
  });

  it("goes negative when the second date is earlier", () => {
    expect(utcDaysBetween("2026-08-11", "2026-08-10")).toBe(-1);
  });
});

describe("daysOwned", () => {
  it("counts day one as one day", () => {
    expect(daysOwned(TODAY, null, TODAY)).toBe(1);
  });

  it("adds a day for each day-boundary crossed", () => {
    expect(daysOwned("2026-08-10", null, TODAY)).toBe(2);
    expect(daysOwned("2026-08-01", null, TODAY)).toBe(11);
    expect(daysOwned("2024-11-03", null, TODAY)).toBe(647);
  });

  it("stops at the end date once retired", () => {
    const retired = daysOwned("2025-09-01", "2026-06-30", TODAY);
    expect(retired).toBe(303);
    // A month later the answer must not have moved.
    expect(daysOwned("2025-09-01", "2026-06-30", "2026-09-11")).toBe(303);
    expect(daysOwned("2025-09-01", "2026-06-30", "2030-01-01")).toBe(303);
  });

  it("never returns less than one, even with a bad end date", () => {
    expect(daysOwned("2026-08-11", "2026-08-01", TODAY)).toBe(1);
    expect(daysOwned("2026-12-25", null, TODAY)).toBe(1);
  });
});

describe("costsFromDays", () => {
  it("divides the price across the days owned", () => {
    const c = costsFromDays(189900, 647);
    expect(c.perDay).toBeCloseTo(189900 / 647, 6);
    expect(c.perMonth).toBeCloseTo((189900 / 647) * DAYS_PER_MONTH, 6);
    expect(c.perYear).toBeCloseTo((189900 / 647) * DAYS_PER_YEAR, 6);
  });

  it("uses averaged months, not calendar months", () => {
    // The whole point: twelve of these months make exactly one 365.25-day year.
    expect(DAYS_PER_MONTH * 12).toBeCloseTo(DAYS_PER_YEAR, 10);
  });

  it("charges a brand-new thing exactly its price for the first month", () => {
    // A R26 000 PC bought this morning must not report R791 375 per month.
    const c = costsFromDays(2_600_000, 1);
    expect(c.perMonth).toBeCloseTo(2_600_000, 6);
    expect(c.perDay).toBeCloseTo(2_600_000 / DAYS_PER_MONTH, 6);
    expect(c.days).toBe(1);
    expect(c.effectiveDays).toBeCloseTo(DAYS_PER_MONTH, 6);
  });

  it("holds the monthly figure flat through the first month, then lets it fall", () => {
    const price = 2_600_000;
    const flat = [1, 7, 15, 30].map((d) => costsFromDays(price, d).perMonth);
    expect(flat.every((v) => Math.abs(v - price) < 1e-6)).toBe(true);

    // The floor lifts the moment real time exceeds it, and never jumps.
    expect(costsFromDays(price, 31).perMonth).toBeLessThan(price);
    expect(costsFromDays(price, 31).perMonth).toBeCloseTo(
      (price / 31) * DAYS_PER_MONTH,
      6,
    );
    expect(costsFromDays(price, 61).perMonth).toBeLessThan(
      costsFromDays(price, 31).perMonth,
    );
  });

  it("leaves anything owned longer than a month untouched", () => {
    for (const days of [31, 303, 647, 1516]) {
      const c = costsFromDays(189900, days);
      expect(c.effectiveDays).toBe(days);
      expect(c.perDay).toBeCloseTo(189900 / days, 6);
    }
  });

  it("keeps every cadence an exact multiple of the others", () => {
    for (const days of [1, 15, 31, 400]) {
      const c = costsFromDays(189900, days);
      expect(c.perWeek).toBeCloseTo(c.perDay * 7, 6);
      expect(c.perMonth).toBeCloseTo(c.perDay * DAYS_PER_MONTH, 6);
      expect(c.perYear).toBeCloseTo(c.perDay * DAYS_PER_YEAR, 6);
      expect(c.perYear).toBeCloseTo(c.perMonth * 12, 6);
    }
  });

  it("never divides by zero", () => {
    expect(Number.isFinite(costsFromDays(189900, 0).perMonth)).toBe(true);
    expect(Number.isFinite(costsFromDays(189900, -5).perMonth)).toBe(true);
  });
});

describe("costsFor", () => {
  it("reports a same-day purchase as costing its price this month", () => {
    const pc = { price_cents: 2_600_000, purchased_on: TODAY, ended_on: null };
    const c = costsFor(pc, TODAY);
    expect(c.days).toBe(1);
    expect(c.perMonth).toBeCloseTo(2_600_000, 6);
  });

  it("prices an item owned for exactly a year", () => {
    // NOTE: the brief's acceptance line quotes R158.42 here. With the brief's own
    // formula — daysOwned = utcDaysBetween + 1, so 366 days — the answer is
    // R157.93. Dropping the `+ 1` gives R158.36. Neither reaches R158.42, so the
    // quoted figure appears to be an arithmetic slip; the formula is followed.
    const item = { price_cents: 189900, purchased_on: "2025-08-11", ended_on: null };
    const c = costsFor(item, TODAY);
    expect(c.days).toBe(366);
    expect(c.perMonth).toBeCloseTo(15792.57, 1);
  });

  it("freezes a retired item's figures permanently", () => {
    const shoes = { price_cents: 210000, purchased_on: "2025-09-01", ended_on: "2026-06-30" };
    const now = costsFor(shoes, TODAY);
    const later = costsFor(shoes, "2027-08-11");
    expect(now).toEqual(later);
    expect(now.perMonth).toBeCloseTo((210000 / 303) * DAYS_PER_MONTH, 6);
  });
});

describe("projectedPerMonth", () => {
  it("is simply the price spread over N * 12 months", () => {
    expect(projectedPerMonth(189900, 1)).toBeCloseTo(189900 / 12, 6);
    expect(projectedPerMonth(189900, 2)).toBeCloseTo(189900 / 24, 6);
    expect(projectedPerMonth(189900, 10)).toBeCloseTo(189900 / 120, 6);
  });
});

describe("projectionRows", () => {
  it("always offers the same five horizons", () => {
    expect(projectionRows(189900, 1).map((r) => r.years)).toEqual([1, 2, 3, 5, 10]);
  });

  it("dates each horizon from the day given, and omits dates when none is", () => {
    // Rounding N * 365.25 days absorbs the leap days, so each horizon lands on
    // the anniversary rather than drifting a day earlier each time.
    const dated = projectionRows(189900, 1, "2026-08-11");
    expect(dated.map((r) => r.on)).toEqual([
      "2027-08-11",
      "2028-08-11",
      "2029-08-11",
      "2031-08-11",
      "2036-08-11",
    ]);
    expect(projectionRows(189900, 1).every((r) => r.on === null)).toBe(true);
  });

  it("marks horizons already lived through as reached", () => {
    const fresh = projectionRows(189900, 1);
    expect(fresh.every((r) => !r.reached)).toBe(true);

    const threeYears = projectionRows(189900, Math.ceil(3 * DAYS_PER_YEAR));
    expect(threeYears.map((r) => r.reached)).toEqual([true, true, true, false, false]);

    const ancient = projectionRows(189900, 10_000);
    expect(ancient.every((r) => r.reached)).toBe(true);
  });
});

describe("settling thresholds", () => {
  it("captions anything under 31 days as still settling", () => {
    expect(isSettling(1)).toBe(true);
    expect(isSettling(30)).toBe(true);
    expect(isSettling(31)).toBe(false);
    expect(isSettling(647)).toBe(false);
  });

  it("calls an item settled once it has been owned a year", () => {
    expect(isSettled(364)).toBe(false);
    expect(isSettled(366)).toBe(true);
  });
});

describe("todayIso and addDays", () => {
  it("formats the local calendar day", () => {
    expect(todayIso(new Date(2026, 7, 11, 23, 30))).toBe("2026-08-11");
    expect(todayIso(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });

  it("walks dates without a date library", () => {
    expect(addDays("2026-08-11", 1)).toBe("2026-08-12");
    expect(addDays("2026-08-11", -365)).toBe("2025-08-11");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });
});
