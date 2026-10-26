// Client-side whitelist validation.
//
// Inputs are sanitized as the user types (silent auto-correction) and re-checked
// before any data is sent to the database. Users only ever see generic field
// messages below — never the exact rules, which stay in this module.

// Names: Unicode letters, optionally separated by spaces, apostrophes,
// hyphens, or periods. This covers names such as O’Brien, Nii-Doku,
// Müller, and St. John without allowing arbitrary punctuation.
const NAME_RE = /^[\p{L}\p{M}]+(?:[ '\u2019\u02BC.\-\u2010\u2011]+[\p{L}\p{M}]+)*$/u;
const NAME_ALLOWED_RE = /[^\p{L}\p{M} '\u2019\u02BC.\-\u2010\u2011]/gu;
const EVENT_RE = /^[A-Za-z0-9]+(?:[ .,'&()-]+[A-Za-z0-9]+)*$/;
// Any real email address (not just Gmail): user@domain.tld with valid labels.
const EMAIL_RE =
  /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
// Phone: exactly ten digits.
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
      // Keep accents, apostrophes, hyphens, and periods. Keep a single trailing
      // space while typing so full names are possible; leading/multiple spaces
      // are removed as the user types.
      return value
        .normalize("NFC")
        .replace(NAME_ALLOWED_RE, "")
        .replace(/\s+/g, " ")
        .replace(/^\s+/, "");
    case "event":
      return value.replace(/[^A-Za-z0-9\s.,'&()-]/g, "").replace(/\s{2,}/g, " ").trim();
    case "phone": {
      const digits = value.replace(/\D/g, "");
      // Accept +233 numbers by converting them to the local 0-prefixed form.
      if (digits.startsWith("233") && digits.length > 10) {
        return ("0" + digits.slice(3)).slice(0, 10);
      }
      return digits.slice(0, 10);
    }
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

export const isValidName = (value: string): boolean => {
  const name = value.trim();
  return name.length >= 2 && name.length <= 100 && NAME_RE.test(name);
};

export const isValidPhone = (value: string): boolean => PHONE_RE.test(value.trim());

export const isValidEmail = (value: string): boolean => {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email);
};

export const isValidEventType = (value: string): boolean => {
  const event = value.trim();
  return event.length >= 2 && event.length <= 100 && EVENT_RE.test(event);
};