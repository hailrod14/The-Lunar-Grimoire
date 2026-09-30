import { PixelSprite } from "@/components/pixel/PixelSprite";

export type Element = "fire" | "water" | "earth" | "air";

const SPRITES: Record<Element, { rows: string[]; palette: Record<string, string> }> = {
  fire: {
    rows: [
      ".....o......",
      "....oro.....",
      "....oro..o..",
      "...orrro.oo.",
      "..orryrrorro",
      ".orryyyrrrro",
      ".orryyyyrrro",
      "orryywwyyrro",
      "orryywwyyrro",
      ".orryyyyyro.",
      "..orrrrrro..",
      "...oooooo...",
    ],
    palette: { o: "#5a1a12", r: "#e8553d", y: "#ffb347", w: "#fff1b8" },
  },
  water: {
    rows: [
      ".....oo.....",
      "....obbo....",
      "....obbo....",
      "...obbbbo...",
      "..obbbbbbo..",
      "..obwbbbbo..",
      ".obwbbbbbbo.",
      ".obwbbbbbbo.",
      ".obbbbbbbdo.",
      ".obbbbbbbdo.",
      "..obbbbbdo..",
      "...oooooo...",
    ],
    palette: { o: "#10284a", b: "#3fa0e0", w: "#d6f0ff", d: "#2566a8" },
  },
  earth: {
    rows: [
      "............",
      ".....oo.....",
      "....owwo....",
      "...owwgoo...",
      "...ogggggo..",
      "..oggggggo..",
      "..ogbggggbo.",
      ".obbbgggbbo.",
      ".obbbbbbbbbo",
      "obbbbbbbbbbo",
      "obbbbbbbbbbo",
      "oooooooooooo",
    ],
    palette: { o: "#2b1a0e", w: "#eef3ff", g: "#6fa84a", b: "#8a5a34" },
  },
  air: {
    rows: [
      "............",
      "......ooo...",
      ".....o...o..",
      ".........o..",
      ".oooooooo...",
      "............",
      ".ooooooooo..",
      "..........o.",
      ".......o..o.",
      "........oo..",
      ".ooooo......",
      "............",
    ],
    palette: { o: "#cfd8f7" },
  },
};

export function ElementSprite({ element, size = 32, title }: { element: Element; size?: number; title?: string }) {
  const { rows, palette } = SPRITES[element];
  return <PixelSprite rows={rows} palette={palette} size={size} title={title} />;
}
