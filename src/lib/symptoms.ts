import type { Grimoire, SymptomSeverity } from "./types";

/** Symptoms offered to everyone; people can add their own alongside these. */
export const BUILT_IN_SYMPTOMS: { id: string; name: string }[] = [
  { id: "cramps", name: "Cramps" },
  { id: "headache", name: "Headache" },
  { id: "bloating", name: "Bloating" },
  { id: "tender-breasts", name: "Tender breasts" },
  { id: "back-pain", name: "Back pain" },
  { id: "acne", name: "Acne" },
  { id: "fatigue", name: "Fatigue" },
  { id: "nausea", name: "Nausea" },
  { id: "cravings", name: "Cravings" },
  { id: "insomnia", name: "Trouble sleeping" },
];

export const SEVERITY_LABEL: Record<SymptomSeverity, string> = { 1: "Mild", 2: "Moderate", 3: "Strong" };

/** Every symptom that can be picked today: built-ins plus active custom ones. */
export function availableSymptoms(g: Grimoire): { id: string; name: string; custom: boolean }[] {
  return [
    ...BUILT_IN_SYMPTOMS.map((s) => ({ ...s, custom: false })),
    ...g.customSymptoms.filter((s) => !s.archived).map((s) => ({ id: s.id, name: s.name, custom: true })),
  ];
}

/** A symptom's display name, including retired custom ones that still appear in history. */
export function symptomName(g: Grimoire, id: string): string {
  return BUILT_IN_SYMPTOMS.find((s) => s.id === id)?.name ?? g.customSymptoms.find((s) => s.id === id)?.name ?? "Unknown symptom";
}
