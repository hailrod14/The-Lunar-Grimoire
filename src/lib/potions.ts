export const VESSELS = ["flask", "vial", "dropper", "herbs", "crystal", "cauldron"] as const;
export type Vessel = (typeof VESSELS)[number];

export const VESSEL_NAMES: Record<Vessel, string> = {
  flask: "Round Flask",
  vial: "Tall Vial",
  dropper: "Tincture Dropper",
  herbs: "Herb Bundle",
  crystal: "Crystal",
  cauldron: "Tiny Cauldron",
};

export const LIQUID_COLORS = {
  gold: "#f2b33d",
  violet: "#8f5ee0",
  teal: "#2fbfa8",
  rose: "#e5638f",
  silver: "#b9c6e4",
  moss: "#7fb04a",
} as const;
export type LiquidColor = keyof typeof LIQUID_COLORS;
