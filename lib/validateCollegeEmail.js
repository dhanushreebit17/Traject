// lib/validateCollegeEmail.js
//
// Client-side check so a student gets an instant, friendly error
// instead of waiting on a round-trip to the server. This is a
// CONVENIENCE check only — the real enforcement lives in the
// `handle_new_user` Postgres trigger (see supabase/schema.sql),
// which runs no matter how the signup request was made. Never rely
// on client-side validation alone for something security-relevant;
// always keep a matching server-side check.
const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;

export function isCollegeEmail(email) {
  if (!ALLOWED_DOMAIN) return true; // no domain configured → allow all (dev mode)
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith('@' + ALLOWED_DOMAIN.toLowerCase());
}

export function collegeEmailErrorMessage() {
  return `Sign-up is restricted to @${ALLOWED_DOMAIN} email addresses.`;
}