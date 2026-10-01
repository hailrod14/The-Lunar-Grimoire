/*
 * The reminder bell (the Cloudflare worker in /push). PUSH_URL is empty until
 * it's deployed; then home-screen reminders appear in Settings. The VAPID
 * public key identifies the bell to browsers; it isn't secret.
 */
export const PUSH_URL = "";
export const VAPID_PUBLIC_KEY = "BIbi99FoBrCRiGt8Fq0MQEFiN2Cj_cgQU_K5xVnj8jgTLQo12-G8Uj-5jRARg4ZdlNVxQAS6y9miUzkvBkWXiso";

export const PUSH_AVAILABLE = PUSH_URL !== "";
