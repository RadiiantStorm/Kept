import { isIsoDate, utcDaysBetween } from "./cost";
import { parsePriceToCents } from "./money";

export type Field =
  | "name"
  | "price"
  | "purchased_on"
  | "ended_on"
  | "priced_on"
  | "url"
  | "note";

export type FieldErrors = Partial<Record<Field | "form", string>>;

/** The copy, in one place, so the same words appear wherever a rule bites. */
export const MESSAGES = {
  name: "Give it a name — anything you'd recognise later.",
  nameTooLong: "That name is too long — keep it under 120 characters.",
  price: "Enter a price like 1899 or R1 899.50",
  purchasedMissing: "Enter the date you bought it.",
  purchasedFuture: "You can't own something you haven't bought yet.",
  endedInvalid: "Enter a real end date, or leave it blank.",
  endedBeforePurchase: "That end date is before you bought it.",
  url: "That link doesn't look like a web address. Leave it blank if you don't have one.",
  note: "That note is too long — keep it under 500 characters.",
  missing: "That item is gone. Someone deleted it in another tab.",
  pricedMissing: "Enter the date you saw this price.",
  pricedFuture: "You can't have seen a price in the future.",
} as const;

export const NAME_MAX = 120;
export const NOTE_MAX = 500;

/** A link is only a link if it is http(s). Nothing is ever fetched from it. */
export function parseHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.hostname === "") return null;
  return url;
}

/** `https://www.takealot.com/thing` -> `takealot.com` */
export function hostLabel(raw: string): string {
  const url = parseHttpUrl(raw);
  if (!url) return "link";
  return url.hostname.replace(/^www\./, "");
}

export type RawItem = {
  name: string;
  price: string;
  purchased_on: string;
  ended_on: string;
  url: string;
  note: string;
};

export type CleanItem = {
  name: string;
  price_cents: number;
  purchased_on: string;
  ended_on: string | null;
  url: string | null;
  note: string | null;
};

export type Validation =
  | { ok: true; value: CleanItem }
  | { ok: false; errors: FieldErrors; focus: Field };

/**
 * Order matters: `focus` is the first field that failed, and that is the field
 * the form puts the cursor back into.
 */
export function validateItem(raw: RawItem, today: string): Validation {
  const errors: FieldErrors = {};
  const order: Field[] = ["name", "price", "purchased_on", "ended_on", "url", "note"];

  const name = raw.name.trim();
  if (name.length === 0) errors.name = MESSAGES.name;
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameTooLong;

  const price = parsePriceToCents(raw.price);
  if (!price.ok) errors.price = MESSAGES.price;

  const purchased = raw.purchased_on.trim();
  if (!isIsoDate(purchased)) errors.purchased_on = MESSAGES.purchasedMissing;
  else if (utcDaysBetween(today, purchased) > 0) errors.purchased_on = MESSAGES.purchasedFuture;

  const endedRaw = raw.ended_on.trim();
  let ended: string | null = null;
  if (endedRaw !== "") {
    if (!isIsoDate(endedRaw)) {
      errors.ended_on = MESSAGES.endedInvalid;
    } else if (isIsoDate(purchased) && utcDaysBetween(purchased, endedRaw) < 0) {
      errors.ended_on = MESSAGES.endedBeforePurchase;
    } else {
      ended = endedRaw;
    }
  }

  const urlRaw = raw.url.trim();
  const url = urlRaw === "" ? null : parseHttpUrl(urlRaw);
  if (urlRaw !== "" && url === null) errors.url = MESSAGES.url;

  const note = raw.note.trim();
  if (note.length > NOTE_MAX) errors.note = MESSAGES.note;

  const failed = order.find((f) => errors[f]);
  if (failed) return { ok: false, errors, focus: failed };

  return {
    ok: true,
    value: {
      name,
      price_cents: (price as { ok: true; cents: number }).cents,
      purchased_on: purchased,
      ended_on: ended,
      url: url ? url.toString() : null,
      note: note === "" ? null : note,
    },
  };
}

export type RawWant = {
  name: string;
  price: string;
  priced_on: string;
  url: string;
  note: string;
};

export type CleanWant = {
  name: string;
  price_cents: number;
  priced_on: string;
  url: string | null;
  note: string | null;
};

export type WantValidation =
  | { ok: true; value: CleanWant }
  | { ok: false; errors: FieldErrors; focus: Field };

/** Same rules as an item, minus the clock: a want has a price and a date, no more. */
export function validateWant(raw: RawWant, today: string): WantValidation {
  const errors: FieldErrors = {};
  const order: Field[] = ["name", "price", "priced_on", "url", "note"];

  const name = raw.name.trim();
  if (name.length === 0) errors.name = MESSAGES.name;
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameTooLong;

  const price = parsePriceToCents(raw.price);
  if (!price.ok) errors.price = MESSAGES.price;

  const priced = raw.priced_on.trim();
  if (!isIsoDate(priced)) errors.priced_on = MESSAGES.pricedMissing;
  else if (utcDaysBetween(today, priced) > 0) errors.priced_on = MESSAGES.pricedFuture;

  const urlRaw = raw.url.trim();
  const url = urlRaw === "" ? null : parseHttpUrl(urlRaw);
  if (urlRaw !== "" && url === null) errors.url = MESSAGES.url;

  const note = raw.note.trim();
  if (note.length > NOTE_MAX) errors.note = MESSAGES.note;

  const failed = order.find((f) => errors[f]);
  if (failed) return { ok: false, errors, focus: failed };

  return {
    ok: true,
    value: {
      name,
      price_cents: (price as { ok: true; cents: number }).cents,
      priced_on: priced,
      url: url ? url.toString() : null,
      note: note === "" ? null : note,
    },
  };
}
