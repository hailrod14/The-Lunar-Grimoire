import { PixelSprite } from "@/components/pixel/PixelSprite";
import { shade } from "@/lib/color";
import { LIQUID_COLORS, type LiquidColor, type Vessel } from "@/lib/potions";

export { LIQUID_COLORS, VESSELS, VESSEL_NAMES, type LiquidColor, type Vessel } from "@/lib/potions";

// Shared keys: o outline · g glass · w shine · c/C cork · e/f pill shell · l liquid · L liquid shadow · B liquid light
const ROWS: Record<Vessel, string[]> = {
  flask: [
    "....cccc....",
    "....oCCo....",
    "....oggo....",
    "....oggo....",
    "...oggggo...",
    "..oggggggo..",
    ".owllllllgo.",
    ".owllllllLo.",
    ".olllllllLo.",
    ".olllllllLo.",
    "..oLLLLLLo..",
    "...oooooo...",
  ],
  vial: [
    "....cccc....",
    "....oCCo....",
    "....oggo....",
    "....owgo....",
    "....owlo....",
    "....owlo....",
    "....ollo....",
    "....ollo....",
    "....olLo....",
    "....olLo....",
    "....oLLo....",
    ".....oo.....",
  ],
  dropper: [
    ".....kk.....",
    "....kkkk....",
    "....kkkk....",
    "....oCCo....",
    "...oooooo...",
    "..oggggggo..",
    "..owlllllo..",
    "..owlllllo..",
    "..olllllLo..",
    "..olllllLo..",
    "..oLLLLLLo..",
    "..oooooooo..",
  ],
  capsule: [
    "........ooo.",
    ".......oBllo",
    "......oBlllo",
    ".....oBlllLo",
    "....oBlllLo.",
    "...oweelLo..",
    "..oweeefo...",
    ".oweeefo....",
    ".oweefo.....",
    ".oeefo......",
    "..ooo.......",
    "............",
  ],
  tablet: [
    "............",
    "....oooo....",
    "..ooBlllloo.",
    ".oBBlllllLo.",
    ".oBllllllLo.",
    "oLLLLLLLLLLo",
    "oBlllllllLLo",
    ".olllllllLo.",
    ".oLllllllLo.",
    "..ooLLLLoo..",
    "....oooo....",
    "............",
  ],
  bottle: [
    "..oooooooo..",
    "..oeeeeeeo..",
    "..offffffo..",
    "..oooooooo..",
    "..oBllllLo..",
    "..oBttttLo..",
    "..oBtsstLo..",
    "..oBttttLo..",
    "..oBllllLo..",
    "..oBllllLo..",
    "..oLLLLLLo..",
    "..oooooooo..",
  ],
  herbs: [
    "..l...l..l..",
    ".lBl.lBl.lB.",
    "..lL.lL.lL..",
    "...lLlLlL...",
    "....lLlL....",
    ".....ss.....",
    "....tttt....",
    ".....ss.....",
    ".....ss.....",
    "....s..s....",
    "...s....s...",
    "............",
  ],
  crystal: [
    ".....oo.....",
    "....owlo....",
    "...owllLo...",
    "..owlllLLo..",
    "..owlllLLo..",
    "..oBlllLLo..",
    "..oBlllLLo..",
    "..owlllLLo..",
    "...owllLo...",
    "....olLo....",
    ".....oo.....",
    "............",
  ],
  cauldron: [
    "....B..B....",
    "...l.ll.l...",
    "..lllBllll..",
    ".oooooooooo.",
    "..okkkkkko..",
    ".okkkkkkkko.",
    ".okhkkkkkko.",
    ".okkkkkkkko.",
    "..okkkkkko..",
    "...oooooo...",
    "...o....o...",
    "............",
  ],
};

type VesselSpriteProps = {
  vessel: Vessel;
  color: LiquidColor;
  size?: number;
  /** Show the vessel emptied/dimmed (e.g. a potion not yet taken). */
  dim?: boolean;
  title?: string;
};

export function VesselSprite({ vessel, color, size = 32, dim = false, title }: VesselSpriteProps) {
  const liquid = LIQUID_COLORS[color];
  const palette: Record<string, string> = {
    o: "#1a1433",
    g: "#3b3a66",
    w: "#e8f0ff",
    c: "#a8744a",
    C: "#7a5232",
    k: "#3a3450",
    h: "#6d6590",
    s: "#6b4a2a",
    t: "#e6cfa0",
    e: "#ece8f4",
    f: "#b6aecb",
    l: dim ? shade(liquid, -0.55) : liquid,
    L: dim ? shade(liquid, -0.7) : shade(liquid, -0.3),
    B: dim ? shade(liquid, -0.4) : shade(liquid, 0.45),
  };
  return <PixelSprite rows={ROWS[vessel]} palette={palette} size={size} title={title} />;
}
