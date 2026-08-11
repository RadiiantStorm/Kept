import type { FieldErrors } from "./validate";

/**
 * Shared shape for every form round-trip. It lives here rather than beside the
 * actions because a `"use server"` module may only export async functions.
 */
export type FormState = {
  errors: FieldErrors;
  /** Echoed back so a rejected form stays filled in. */
  values: Record<string, string>;
  /** Field to put the cursor back into. */
  focus?: string;
  /** Bumped on every response, so a repeated failure still re-focuses. */
  attempt: number;
};

export const emptyFormState: FormState = { errors: {}, values: {}, attempt: 0 };
