// Client-side whitelist validation.
//
// Inputs are sanitized as the user types (silent auto-correction) and re-checked
// before any data is sent to the database. Users only ever see generic field
// messages below — never the exact rules, which stay in this module.

const NAME_RE = /^[A-Za-z]+(?:[' ’.-]+[A-Za-z]+)*$/;
const EVENT_RE = /^[A-Za-z0-9]+(?:[ .,'&()-]+[A-Za-z0-9]+)*$/;
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?(?:\+[a-z0-9]+)?@gmail\.com$/;
const PHONE_RE = /^\d{10}$/;

// Generic, rule-free messages shown to users when a field is invalid.
export const NAME_MESSAGE = "Please re-check your name.";
export const EMAIL_MESSAGE = "We could not verify that email address. Please double-check it.";
export const PHONE_MESSAGE = "Please re-check your phone number.";
export const EVENT_MESSAGE = "Please re-check the event type.";

export type InputKind = "name" | "phone" | "email" | "event";

// Silent auto-correction applied on every keystroke.
export const sanitizeInput = (value: string, kind: InputKind): string => {
  switch (kind) {
    case "name":
      return value.replace(/[^A-Za-z\s.'’-]/g, "").replace(/\s{2,}/g, " ").trim();
    case "event":
      return value.replace(/[^A-Za-z0-9\s.,'&()-]/g, "").replace(/\s{2,}/g, " ").trim();
    case "phone":
      return value.replace(/\D/g, "");
    case "email":
      return value.replace(/\s+/g, "").toLowerCase();
  }
};

// Strip control characters from free-text prose (descriptions / reviews).
export const sanitizeProse = (value: string): string =>
  Array.from(value)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");

// Common phone typo: "+233 55 586 9522" -> digits "233555869522" -> "0555869522".
export const autocorrectPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length > 10) {
    return "0" + digits.slice(3).slice(0, 10);
  }
  return digits;
};

export const isValidName = (value: string): boolean =>
  value.length >= 2 && NAME_RE.test(value);

export const isValidPhone = (value: string): boolean => PHONE_RE.test(value);

export const isValidEmail = (value: string): boolean => GMAIL_RE.test(value);

export const isValidEventType = (value: string): boolean =>
  value.length >= 2 && EVENT_RE.test(value);