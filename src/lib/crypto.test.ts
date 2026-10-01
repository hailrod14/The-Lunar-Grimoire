import { describe, expect, it } from "vitest";
import { deriveSeal, isSealed, openText, sealText } from "./crypto";

// Fewer rounds keep the tests quick; the app uses the full 600,000.
const ROUNDS = 1000;

describe("PIN encryption", () => {
  it("seals and opens with the same PIN", async () => {
    const seal = await deriveSeal("2468", undefined, ROUNDS);
    const sealed = await sealText('{"journal":"Moonlit secrets"}', seal);
    expect(isSealed(sealed)).toBe(true);
    expect(sealed.data).not.toContain("Moonlit");
    const again = await deriveSeal("2468", sealed.salt, ROUNDS);
    expect(await openText(sealed, again.key)).toBe('{"journal":"Moonlit secrets"}');
  });

  it("refuses the wrong PIN", async () => {
    const sealed = await sealText("secret", await deriveSeal("2468", undefined, ROUNDS));
    const wrong = await deriveSeal("1357", sealed.salt, ROUNDS);
    await expect(openText(sealed, wrong.key)).rejects.toThrow();
  });

  it("detects tampering", async () => {
    const seal = await deriveSeal("2468", undefined, ROUNDS);
    const sealed = await sealText("secret", seal);
    const bytes = atob(sealed.data);
    const flipped = btoa(String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1));
    await expect(openText({ ...sealed, data: flipped }, seal.key)).rejects.toThrow();
  });

  it("uses a fresh salt per PIN and a fresh nonce per save", async () => {
    const a = await deriveSeal("2468", undefined, ROUNDS);
    const b = await deriveSeal("2468", undefined, ROUNDS);
    expect(a.salt).not.toBe(b.salt);
    const first = await sealText("same text", a);
    const second = await sealText("same text", a);
    expect(first.iv).not.toBe(second.iv);
    expect(first.data).not.toBe(second.data);
  });

  it("recognizes only sealed Grimoires", () => {
    expect(isSealed({ version: 2, days: {} })).toBe(false);
    expect(isSealed(null)).toBe(false);
  });
});
