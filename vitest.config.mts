import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // Calendar days depend on the time zone; pin one so tests agree on every machine (and CI, which runs on UTC).
    env: { TZ: "America/New_York" },
  },
});
