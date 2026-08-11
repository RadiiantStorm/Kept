"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isIsoDate, todayIso, utcDaysBetween } from "@/lib/cost";
import * as store from "@/lib/db";
import type { FormState } from "@/lib/form";
import { THEME_COOKIE, toTheme } from "@/lib/theme";
import { MESSAGES, validateItem, validateWant } from "@/lib/validate";

function readItemForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    purchased_on: String(formData.get("purchased_on") ?? ""),
    ended_on: String(formData.get("ended_on") ?? ""),
    url: String(formData.get("url") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
}

/**
 * Every write revalidates both the dashboard and the item, so two open tabs
 * never sit on stale figures after the other one saves.
 */
function revalidateItem(id: string) {
  revalidatePath("/");
  revalidatePath(`/items/${id}`);
  revalidatePath(`/items/${id}/edit`);
}

export async function createItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = readItemForm(formData);
  const result = validateItem(raw, todayIso());

  if (!result.ok) {
    return {
      errors: result.errors,
      values: raw,
      focus: result.focus,
      attempt: _prev.attempt + 1,
    };
  }

  const id = store.insertItem(result.value);

  // Logged straight off the wishlist: it has been bought, so it leaves the list.
  const fromWant = String(formData.get("from_want") ?? "");
  if (fromWant && store.getWant(fromWant)) {
    store.deleteWant(fromWant);
    revalidatePath("/wants");
  }

  revalidateItem(id);
  redirect(`/?new=${id}`);
}

export async function updateItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const raw = readItemForm(formData);

  if (!store.getItem(id)) {
    return {
      errors: { form: MESSAGES.missing },
      values: raw,
      attempt: _prev.attempt + 1,
    };
  }

  const result = validateItem(raw, todayIso());
  if (!result.ok) {
    return {
      errors: result.errors,
      values: raw,
      focus: result.focus,
      attempt: _prev.attempt + 1,
    };
  }

  // Last write wins: no version check, no conflict dialog.
  store.updateItem(id, result.value);
  revalidateItem(id);
  redirect(`/items/${id}`);
}

export async function retireItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const endedOn = String(formData.get("ended_on") ?? "").trim();
  const values = { ended_on: endedOn };

  const item = store.getItem(id);
  if (!item) {
    return { errors: { form: MESSAGES.missing }, values, attempt: _prev.attempt + 1 };
  }

  if (!isIsoDate(endedOn)) {
    return {
      errors: { ended_on: MESSAGES.endedInvalid },
      values,
      focus: "ended_on",
      attempt: _prev.attempt + 1,
    };
  }

  if (utcDaysBetween(item.purchased_on, endedOn) < 0) {
    return {
      errors: { ended_on: MESSAGES.endedBeforePurchase },
      values,
      focus: "ended_on",
      attempt: _prev.attempt + 1,
    };
  }

  store.setEndedOn(id, endedOn);
  revalidateItem(id);
  redirect(`/items/${id}`);
}

/** Delete is permanent and immediate. There is no soft-delete. */
export async function deleteItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    store.deleteItem(id);
    revalidateItem(id);
  }
  redirect("/");
}

// ---------------------------------------------------------------------------
// Wants
// ---------------------------------------------------------------------------

function readWantForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    price: String(formData.get("price") ?? ""),
    priced_on: String(formData.get("priced_on") ?? ""),
    url: String(formData.get("url") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
}

export async function createWant(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = readWantForm(formData);
  const result = validateWant(raw, todayIso());

  if (!result.ok) {
    return {
      errors: result.errors,
      values: raw,
      focus: result.focus,
      attempt: _prev.attempt + 1,
    };
  }

  const id = store.insertWant(result.value);
  revalidatePath("/wants");
  redirect(`/wants?new=${id}`);
}

export async function updateWant(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const raw = readWantForm(formData);

  if (!store.getWant(id)) {
    return {
      errors: { form: MESSAGES.missing },
      values: raw,
      attempt: _prev.attempt + 1,
    };
  }

  const result = validateWant(raw, todayIso());
  if (!result.ok) {
    return {
      errors: result.errors,
      values: raw,
      focus: result.focus,
      attempt: _prev.attempt + 1,
    };
  }

  store.updateWant(id, result.value);
  revalidatePath("/wants");
  revalidatePath(`/wants/${id}/edit`);
  redirect("/wants");
}

export async function deleteWant(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (id) {
    store.deleteWant(id);
    revalidatePath("/wants");
  }
  redirect("/wants");
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Stored in a cookie so the server can render the right theme on first paint. */
export async function setTheme(formData: FormData): Promise<void> {
  const theme = toTheme(formData.get("theme"));
  const jar = await cookies();

  if (theme === "system") {
    jar.delete(THEME_COOKIE);
  } else {
    jar.set(THEME_COOKIE, theme, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365 * 5,
    });
  }

  revalidatePath("/", "layout");
}
