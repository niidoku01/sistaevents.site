// Server-side whitelist shared by bookings and reviews.
// Keeps the same rules as the client, so data that somehow skips the UI
// still cannot reach the database. Messages are generic on purpose:
// users get an alert to correct the field, never the underlying rules.

const NAME_RE = /^[A-Za-z]+(?:[' ’.-]+[A-Za-z]+)*$/;
const EVENT_RE = /^[A-Za-z0-9]+(?:[ .,'&()-]+[A-Za-z0-9]+)*$/;
const GMAIL_RE = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?(?:\+[a-z0-9]+)?@gmail\.com$/;
const PHONE_RE = /^\d{10}$/;

export const INVALID_NAME = "Please re-check the name and try again.";
export const INVALID_EMAIL = "We could not verify that email address. Please double-check it.";
export const INVALID_PHONE = "Please re-check the phone number and try again.";
export const INVALID_EVENT = "Please re-check the event type and try again.";
export const INVALID_DATE = "Please pick a valid event date.";

export const isValidName = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && NAME_RE.test(value.trim());

export const isValidEmail = (value: string): boolean => GMAIL_RE.test(value.trim().toLowerCase());

export const isValidPhone = (value: string): boolean => PHONE_RE.test(value.trim());

export const isValidEventType = (value: string): boolean =>
  value.trim().length >= 2 && value.trim().length <= 100 && EVENT_RE.test(value.trim());