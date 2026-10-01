import { describe, expect, it } from "vitest";
import { area, curlFrame } from "./curl";

const W = 400;
const H = 600;

describe("curlFrame", () => {
  it("starts with the whole page flat and no flap", () => {
    const f = curlFrame(W, H, 0, "forward");
    expect(area(f.page)).toBe(W * H);
    expect(f.flap).toEqual([]);
  });

  it.each([0.1, 0.3, 0.5, 0.7, 0.9])("never loses or gains paper at t=%s", (t) => {
    for (const dir of ["forward", "backward"] as const) {
      const f = curlFrame(W, H, t, dir);
      // The flap is a mirror image of the lifted part, so the areas add up to the page.
      expect(area(f.page) + area(f.flap)).toBeCloseTo(W * H, 6);
    }
  });

  it("lifts the bottom-right corner first when turning forward", () => {
    const f = curlFrame(W, H, 0.15, "forward");
    const flatCorners = f.page.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`);
    expect(flatCorners).toContain("0,0");
    expect(flatCorners).not.toContain(`${W},${H}`);
  });

  it("lifts the bottom-left corner first when turning backward", () => {
    const f = curlFrame(W, H, 0.15, "backward");
    const flatCorners = f.page.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`);
    expect(flatCorners).toContain(`${W},0`);
    expect(flatCorners).not.toContain(`0,${H}`);
  });

  it("has turned the whole page by the end", () => {
    expect(area(curlFrame(W, H, 1, "forward").page)).toBeCloseTo(0, 6);
    expect(area(curlFrame(W, H, 1, "backward").page)).toBeCloseTo(0, 6);
  });

  it("uncovers more of the next page as the turn goes on", () => {
    const flat = [0.2, 0.4, 0.6, 0.8].map((t) => area(curlFrame(W, H, t, "forward").page));
    for (let i = 1; i < flat.length; i++) expect(flat[i]).toBeLessThan(flat[i - 1]);
  });
});
