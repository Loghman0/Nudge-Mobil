import type { DiscoveryDomain } from "./types";
export const DISCOVERY_DOMAINS: { id: DiscoveryDomain; label: string; subdomains: string[]; optional?: boolean }[] = [
  { id: "rest", label: "Rest & energy", subdomains: ["breaks", "stimulation", "recovery", "solitude"] },
  { id: "time", label: "Time & routines", subdomains: ["planning", "pace", "priorities", "transitions"] },
  { id: "values", label: "Values & priorities", subdomains: ["tradeoffs", "autonomy", "quality", "friction"] },
  { id: "relationships", label: "Relationships", subdomains: ["support", "scheduling", "communication", "boundaries"] },
  { id: "work", label: "Work & collaboration", subdomains: ["focus", "collaboration", "feedback", "ambition"] },
  { id: "learning", label: "Learning & curiosity", subdomains: ["starting", "practice", "explanations", "challenge"] },
  { id: "money", label: "Money & consumption", subdomains: ["purchasing", "repair", "borrowing", "priorities"] },
  { id: "food", label: "Food & senses", subdomains: ["novelty", "texture", "preparation", "flavor"] },
  { id: "culture", label: "Culture & belonging", subdomains: ["exploration", "traditions", "stories", "music"] },
  { id: "play", label: "Play & humor", subdomains: ["humor", "cooperation", "games", "competition"] },
  { id: "creativity", label: "Creativity & making", subdomains: ["starting", "making", "experimenting", "finishing"] },
  { id: "childhood", label: "Childhood & change", subdomains: ["interests", "change", "ordinary_memories"], optional: true },
  { id: "uncertainty", label: "Uncertainty & courage", subdomains: ["support", "surprise", "small_steps"], optional: true },
  { id: "community", label: "Ethics & community", subdomains: ["fairness", "contribution", "reciprocity", "sustainability"] },
  { id: "places", label: "Places & environment", subdomains: ["comfort", "home", "travel", "outdoors"] },
  { id: "movement", label: "Movement & comfort", subdomains: ["comfort", "rest", "enjoyment"] },
  { id: "digital", label: "Digital life & attention", subdomains: ["attention", "channels", "privacy", "information"] },
  { id: "future", label: "Future & goals", subdomains: ["goals", "progress", "experiments"] },
];
export function discoveryDomain(value: unknown): DiscoveryDomain | null {
  return typeof value === "string" && DISCOVERY_DOMAINS.some(domain => domain.id === value) ? value as DiscoveryDomain : null;
}
export function discoveryDomainLabel(value: string): string { return DISCOVERY_DOMAINS.find(domain => domain.id === value)?.label ?? "Your interests"; }
