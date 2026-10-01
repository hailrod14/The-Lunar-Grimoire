import { PBKDF2_ROUNDS, fromBase64, toBase64 } from "./crypto";
import { sanitizeGrimoire } from "./storage";
import type { Grimoire } from "./types";

/*
 * End-to-end encryption for sync. The sync passphrase is stretched with
 * PBKDF2 into an AES-256 key on each device; the Grimoire is compressed and
 * sealed with AES-GCM before upload, so the server only ever holds
 * ciphertext. The derived key bytes are kept on the device (sealed under the
 * PIN when one is set) so the passphrase is typed once per device.
 */

export type SyncKey = { raw: string; salt: string; rounds: number };

export async function deriveSyncKey(passphrase: string, salt?: string, rounds = PBKDF2_ROUNDS): Promise<SyncKey> {
  const saltBytes = salt ? fromBase64(salt) : crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase.normalize("NFC")), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: rounds, hash: "SHA-256" }, material, 256);
  return { raw: toBase64(new Uint8Array(bits)), salt: toBase64(saltBytes), rounds };
}

const importKey = (raw: string) => crypto.subtle.importKey("raw", fromBase64(raw), "AES-GCM", false, ["encrypt", "decrypt"]);

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export type CloudSeal = { iv: Uint8Array; data: Uint8Array };

/** Compress and encrypt a Grimoire for upload. */
export async function sealForCloud(g: Grimoire, key: SyncKey): Promise<CloudSeal> {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(g)), new CompressionStream("gzip"));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await importKey(key.raw), packed as BufferSource));
  return { iv, data };
}

export class WrongKeyError extends Error {}

/** Decrypt and validate a downloaded Grimoire. Throws WrongKeyError for a wrong passphrase. */
export async function openFromCloud(sealed: CloudSeal, key: SyncKey): Promise<Grimoire> {
  let packed: ArrayBuffer;
  try {
    packed = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv as BufferSource }, await importKey(key.raw), sealed.data as BufferSource);
  } catch {
    throw new WrongKeyError("That passphrase doesn't open this Grimoire.");
  }
  const text = new TextDecoder().decode(await pipe(new Uint8Array(packed), new DecompressionStream("gzip")));
  const parsed = sanitizeGrimoire(JSON.parse(text));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.grimoire;
}
