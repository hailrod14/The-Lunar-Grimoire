/*
 * Encryption for the PIN lock. The PIN is stretched into an AES-256 key with
 * PBKDF2 (600,000 rounds of SHA-256, OWASP's current recommendation, so each
 * guess is deliberately slow), and the whole Grimoire is sealed with AES-GCM,
 * which also detects any tampering. The key never leaves memory and can't be
 * exported; only the salt, IV, and ciphertext are stored.
 */

export const PBKDF2_ROUNDS = 600_000;

/** What's stored in place of the Grimoire while a PIN is set. */
export type SealedGrimoire = {
  kind: "lunar-grimoire-sealed";
  v: 1;
  /** Base64 PBKDF2 salt (16 bytes). */
  salt: string;
  /** Base64 AES-GCM nonce (12 bytes), new for every save. */
  iv: string;
  /** Base64 ciphertext of the Grimoire's JSON. */
  data: string;
  rounds: number;
};

/** A derived key plus what's needed to store alongside it. */
export type Seal = { key: CryptoKey; salt: string; rounds: number };

export const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
export const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

export function isSealed(value: unknown): value is SealedGrimoire {
  const v = value as SealedGrimoire;
  return (
    typeof v === "object" &&
    v !== null &&
    v.kind === "lunar-grimoire-sealed" &&
    typeof v.salt === "string" &&
    typeof v.iv === "string" &&
    typeof v.data === "string" &&
    typeof v.rounds === "number"
  );
}

/** Stretch a PIN into a key. Pass an existing salt to unlock, or none to make a new seal. */
export async function deriveSeal(pin: string, salt?: string, rounds = PBKDF2_ROUNDS): Promise<Seal> {
  const saltBytes = salt ? fromBase64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: rounds, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { key, salt: toBase64(saltBytes), rounds };
}

export async function sealText(text: string, seal: Seal): Promise<SealedGrimoire> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, seal.key, new TextEncoder().encode(text));
  return { kind: "lunar-grimoire-sealed", v: 1, salt: seal.salt, iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)), rounds: seal.rounds };
}

/** Decrypt, or throw if the key is wrong or the data was altered. */
export async function openText(sealed: SealedGrimoire, key: CryptoKey): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(sealed.iv) }, key, fromBase64(sealed.data));
  return new TextDecoder().decode(plain);
}
