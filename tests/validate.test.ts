import { describe, expect, it } from "vitest";

import {
  MESSAGES,
  hostLabel,
  parseHttpUrl,
  validateItem,
  validateWant,
} from "../lib/validate";

const TODAY = "2026-08-11";

const goodItem = {
  name: "  Logitech G Pro X keyboard  ",
  price: "R1 899",
  purchased_on: "2024-11-03",
  ended_on: "",
  url: " https://www.takealot.com/example-keyboard ",
  note: "  hall effect switches  ",
};

const goodWant = {
  name: "Standing desk",
  price: "R4 999,00",
  priced_on: "2026-08-01",
  url: "",
  note: "",
};

describe("parseHttpUrl", () => {
  it("accepts only http and https", () => {
    expect(parseHttpUrl("https://takealot.com")?.hostname).toBe("takealot.com");
    expect(parseHttpUrl("http://localhost:3000/x")?.hostname).toBe("localhost");
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("file:///etc/passwd")).toBeNull();
    expect(parseHttpUrl("takealot.com")).toBeNull();
    expect(parseHttpUrl("")).toBeNull();
  });
});

describe("hostLabel", () => {
  it("drops the www and the rest of the path", () => {
    expect(hostLabel("https://www.takealot.com/a/b?c=1")).toBe("takealot.com");
    expect(hostLabel("https://shop.example.co.za/x")).toBe("shop.example.co.za");
  });
});

describe("validateItem", () => {
  it("trims, parses and normalises a good item", () => {
    const result = validateItem(goodItem, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      name: "Logitech G Pro X keyboard",
      price_cents: 189900,
      purchased_on: "2024-11-03",
      ended_on: null,
      url: "https://www.takealot.com/example-keyboard",
      note: "hall effect switches",
    });
  });

  it("turns blank optional fields into null, not empty strings", () => {
    const result = validateItem({ ...goodItem, url: "  ", note: "" }, TODAY);
    expect(result.ok && result.value.url).toBeNull();
    expect(result.ok && result.value.note).toBeNull();
  });

  it("refuses a purchase date in the future and says so", () => {
    const result = validateItem({ ...goodItem, purchased_on: "2026-12-25" }, TODAY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.purchased_on).toBe(MESSAGES.purchasedFuture);
    expect(result.focus).toBe("purchased_on");
  });

  it("allows a purchase made today", () => {
    expect(validateItem({ ...goodItem, purchased_on: TODAY }, TODAY).ok).toBe(true);
  });

  it("refuses an end date before the purchase date", () => {
    const result = validateItem({ ...goodItem, ended_on: "2024-11-02" }, TODAY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.ended_on).toBe(MESSAGES.endedBeforePurchase);
  });

  it("allows an end date equal to the purchase date", () => {
    expect(validateItem({ ...goodItem, ended_on: "2024-11-03" }, TODAY).ok).toBe(true);
  });

  it("focuses the first failing field, reading down the form", () => {
    const result = validateItem(
      { ...goodItem, name: "", price: "free", purchased_on: "2026-12-25" },
      TODAY,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.focus).toBe("name");
    // Every failure is still reported, not just the focused one.
    expect(result.errors.price).toBe(MESSAGES.price);
    expect(result.errors.purchased_on).toBe(MESSAGES.purchasedFuture);
  });

  it("rejects a name over 120 characters and a note over 500", () => {
    expect(validateItem({ ...goodItem, name: "x".repeat(121) }, TODAY).ok).toBe(false);
    expect(validateItem({ ...goodItem, name: "x".repeat(120) }, TODAY).ok).toBe(true);
    expect(validateItem({ ...goodItem, note: "x".repeat(501) }, TODAY).ok).toBe(false);
    expect(validateItem({ ...goodItem, note: "x".repeat(500) }, TODAY).ok).toBe(true);
  });

  it("rejects a link that is not a web address", () => {
    const result = validateItem({ ...goodItem, url: "takealot" }, TODAY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.url).toBe(MESSAGES.url);
  });
});

describe("validateWant", () => {
  it("parses a good want", () => {
    const result = validateWant(goodWant, TODAY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      name: "Standing desk",
      price_cents: 499900,
      priced_on: "2026-08-01",
      url: null,
      note: null,
    });
  });

  it("refuses a price seen in the future", () => {
    const result = validateWant({ ...goodWant, priced_on: "2026-08-12" }, TODAY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.priced_on).toBe(MESSAGES.pricedFuture);
    expect(result.focus).toBe("priced_on");
  });

  it("still requires a name and a parseable price", () => {
    const result = validateWant({ ...goodWant, name: " ", price: "soon" }, TODAY);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.name).toBe(MESSAGES.name);
    expect(result.errors.price).toBe(MESSAGES.price);
  });
});
