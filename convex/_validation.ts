// Server-side whitelist shared by bookings and reviews.
// Keeps the same rules as the client, so data that somehow skips the UI
// still cannot reach the database. Messages are generic on purpose:
// users get an alert to correct the field, never the underlying rules.

const NAME_RE = /^[A-Za-z]+(?:[' ’.-]+[A-Za-z]+)*$/;
const EVENT_RE = /^[A-Za-z0-9]+(?:[ .,'&()-]+[A-Za-z0-9]+)*$/;
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?(?:\+[a-z0-9]+)?@gmail\.com$/;
const PHONE_RE = /^\d{10}$/;

export const INVALID_NAME = "Invalid input , re-check the name and try again.";
export const INVALID_EMAIL = "Invalid email address.";
export const INVALID_PHONE = "Invalid phone number.";
export const INVALID_EVENT = "Invalid event type .";
export const INVALID_DATE = "Invalid event date.";

export const isValidName = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && NAME_RE.test(value.trim());

export const isValidEmail = (value: string): boolean => GMAIL_RE.test(value.trim().toLowerCase());

export const isValidPhone = (value: string): boolean => PHONE_RE.test(value.trim());

export const isValidEventType = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && EVENT_RE.test(value.trim());