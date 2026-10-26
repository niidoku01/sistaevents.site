// Server-side whitelist shared by bookings and reviews.
// Keeps the same rules as the client, so data that somehow skips the UI
// still cannot reach the database. Messages are generic on purpose:
// users get an alert to correct the field, never the underlying rules.

// Names: Unicode letters, optionally separated by spaces, apostrophes,
// hyphens, or periods. This covers names such as O’Brien, Nii-Doku,
// Müller, and St. John without allowing arbitrary punctuation.
const NAME_RE = /^[\p{L}\p{M}]+(?:[ '\u2019\u02BC.\-\u2010\u2011]+[\p{L}\p{M}]+)*$/u;
const EVENT_RE = /^[A-Za-z0-9]+(?:[ .,'&()-]+[A-Za-z0-9]+)*$/;
// Any real email address (not just Gmail): user@domain.tld with valid labels.
const EMAIL_RE =
  /^(?!.*\.\.)[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
// Phone: exactly ten digits.
const PHONE_RE = /^\d{10}$/;

export const INVALID_NAME = "Invalid input , re-check the name and try again.";
export const INVALID_EMAIL = "Invalid email address.";
export const INVALID_PHONE = "Invalid phone number.";
export const INVALID_EVENT = "Invalid event type .";
export const INVALID_DATE = "Invalid event date.";

export const isValidName = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && NAME_RE.test(value.trim());

export const isValidEmail = (value: string): boolean => {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email);
};

export const isValidPhone = (value: string): boolean => PHONE_RE.test(value.trim());

export const isValidEventType = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && EVENT_RE.test(value.trim());