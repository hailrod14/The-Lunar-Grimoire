import { describe, expect, it } from "vitest";
import { addDose, savePotion, setJournal, updateSettings } from "./grimoire";
import { mergeGrimoires } from "./merge";
import { RevisionConflict, createCloudCopy, joinCloudCopy, syncOnce, type Cloud, type CloudDoc, type SyncIO, type SyncRecord } from "./sync-engine";
import { WrongKeyError } from "./sync-crypto";
import { newGrimoire, type Grimoire, type Potion } from "./types";

class FakeCloud implements Cloud {
  doc: CloudDoc | null = null;
  writes = 0;
  /** Run once before the next write lands, to simulate another device writing first. */
  beforeWrite: (() => Promise<void>) | null = null;
  async read() {
    return this.doc ? { ...this.doc } : null;
  }
  async write(_uid: string, doc: Omit<CloudDoc, "rev">, expectedRev: number) {
    if (this.beforeWrite) {
      const run = this.beforeWrite;
      this.beforeWrite = null;
      await run();
    }
    if ((this.doc?.rev ?? 0) !== expectedRev) throw new RevisionConflict();
    this.writes++;
    this.doc = { ...doc, rev: expectedRev + 1 };
    return expectedRev + 1;
  }
  async remove() {
    this.doc = null;
  }
}

class Device implements SyncIO {
  g: Grimoire;
  rec: SyncRecord | null = null;
  constructor(
    public cloud: Cloud,
    g = newGrimoire(),
  ) {
    this.g = g;
  }
  local() {
    return this.g;
  }
  apply(seen: Grimoire, merged: Grimoire) {
    this.g = this.g === seen ? merged : mergeGrimoires(seen, this.g, merged);
  }
  record() {
    return this.rec;
  }
  async saveRecord(r: SyncRecord | null) {
    this.rec = r;
  }
  now() {
    return "2026-10-01T12:00:00Z";
  }
  edit(fn: (g: Grimoire) => Grimoire) {
    this.g = fn(this.g);
  }
}

const potion: Omit<Potion, "id"> = {
  name: "Iron",
  dose: "1",
  times: ["09:00"],
  days: [],
  vessel: "capsule",
  color: "gold",
  schedule: "daily",
  archived: false,
  reminder: false,
};

async function pair() {
  const cloud = new FakeCloud();
  const laptop = new Device(cloud, savePotion(newGrimoire(), potion));
  await createCloudCopy(laptop, "me", "correct horse battery");
  const phone = new Device(cloud);
  await joinCloudCopy(phone, "me", "correct horse battery", true);
  return { cloud, laptop, phone, id: laptop.g.potions[0].id };
}

describe("sync", () => {
  it("encrypts: the cloud copy holds no readable text", async () => {
    const cloud = new FakeCloud();
    const laptop = new Device(cloud, setJournal(newGrimoire(), "2026-10-01", "secret moonlit thoughts"));
    await createCloudCopy(laptop, "me", "correct horse battery");
    const bytes = new TextDecoder("latin1").decode(cloud.doc!.data);
    expect(bytes).not.toContain("secret");
    expect(bytes).not.toContain("journal");
  });

  it("a new device adopts the cloud copy", async () => {
    const { laptop, phone } = await pair();
    expect(phone.g).toEqual(laptop.g);
  });

  it("rejects a wrong passphrase", async () => {
    const { cloud } = await pair();
    await expect(joinCloudCopy(new Device(cloud), "me", "wrong guess here", true)).rejects.toBeInstanceOf(WrongKeyError);
  });

  it("carries changes both ways and merges edits made on both", async () => {
    const { cloud, laptop, phone, id } = await pair();
    phone.edit((g) => addDose(g, "2026-10-01", id, "08:00"));
    laptop.edit((g) => setJournal(g, "2026-10-01", "From the laptop"));
    expect(await syncOnce(phone)).toBe("synced");
    expect(await syncOnce(laptop)).toBe("synced");
    expect(await syncOnce(phone)).toBe("synced");
    for (const d of [phone, laptop]) {
      expect(d.g.days["2026-10-01"].potionLogs.map((l) => l.time)).toEqual(["08:00"]);
      expect(d.g.days["2026-10-01"].journal).toBe("From the laptop");
    }
    const writes = cloud.writes;
    expect(await syncOnce(laptop)).toBe("synced");
    expect(cloud.writes).toBe(writes); // nothing new: nothing written
  });

  it("retries when another device writes in between", async () => {
    const { cloud, laptop, phone } = await pair();
    laptop.edit((g) => updateSettings(g, { soundEnabled: false }));
    phone.edit((g) => updateSettings(g, { musicEnabled: true }));
    cloud.beforeWrite = async () => {
      await syncOnce(phone);
    };
    expect(await syncOnce(laptop)).toBe("synced");
    expect(laptop.g.settings).toMatchObject({ soundEnabled: false, musicEnabled: true });
    await syncOnce(phone);
    expect(phone.g.settings).toMatchObject({ soundEnabled: false, musicEnabled: true });
  });

  it("joining with entries of your own keeps them, merged in", async () => {
    const { cloud, laptop } = await pair();
    const tablet = new Device(cloud, setJournal(newGrimoire(), "2026-09-01", "Older notes"));
    expect(await joinCloudCopy(tablet, "me", "correct horse battery", false)).toBe("synced");
    expect(tablet.g.days["2026-09-01"].journal).toBe("Older notes");
    expect(tablet.g.potions).toHaveLength(1);
    await syncOnce(laptop);
    expect(laptop.g.days["2026-09-01"].journal).toBe("Older notes");
  });

  it("notices when the cloud copy was deleted", async () => {
    const { cloud, phone } = await pair();
    await cloud.remove();
    expect(await syncOnce(phone)).toBe("cloud-gone");
  });
});
