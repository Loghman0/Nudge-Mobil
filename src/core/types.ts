export type DiscoveryDomain = "rest" | "time" | "values" | "relationships" | "work" | "learning" | "money" | "food" | "culture" | "play" | "creativity" | "childhood" | "uncertainty" | "community" | "places" | "movement" | "digital" | "future";
export type DiscoveryResponse =
  | { kind: "choice"; optionId: string }
  | { kind: "scale"; value: number }
  | { kind: "ranking"; groups: string[][] }
  | { kind: "text"; text: string }
  | { kind: "depends"; context?: string }
  | { kind: "both" } | { kind: "neither" } | { kind: "skip" };
export type DiscoveryNeutralResponse = "both" | "depends" | "neither" | "skip";
export type DiscoveryEvidenceState = "you_said" | "early_signal" | "repeated_pattern" | "mixed" | "user_confirmed";
/** An optional, self-reported session context, never an inferred profile attribute. */
export type DiscoveryMood = "happy" | "excited" | "calm" | "sad" | "angry" | "anxious" | "tired" | "mixed";
export interface DiscoverySignalRule {
  optionId?: string;
  attributeKey: string;
  value: string;
  statement: string;
  scope: string;
  kind: "preference" | "value" | "habit" | "goal" | "constraint" | "tendency";
  strength: "direct" | "indirect";
  criterion?: { label: string; decisionDomains: string[] };
}
export interface DiscoveryQuestion {
  id: string;
  version: number;
  familyId: string;
  domain: DiscoveryDomain;
  subdomain: string;
  prompt: string;
  format: "choice" | "scale" | "ranking" | "text";
  choices?: { id: string; label: string }[];
  scale?: { min: number; max: number; step: number; minLabel: string; maxLabel: string };
  ranking?: { min: number; max: number; allowTies: boolean };
  purpose: "evidence" | "playful";
  depth: 0 | 1 | 2;
  sensitivity: "ordinary" | "optional";
  estimatedSeconds: number;
  preview?: boolean;
  status: "published" | "draft" | "retired";
  source: "starter" | "existing" | "generated";
  allowedResponses: DiscoveryNeutralResponse[];
  signals?: DiscoverySignalRule[];
  tags?: string[];
  legacyQuestionId?: string;
  /** An authoring review is not evidence of human/clinical validation. */
  review?: { type: "authored_seed" | "existing_catalog" | "editor_approved"; version: number; reviewer?: string; reviewedAt?: string };
}
export type Question = DiscoveryQuestion;
export interface DiscoveryAnswerInput { questionId: string; questionVersion: number; response: DiscoveryResponse }
export type DiscoveryAnswer = DiscoveryAnswerInput & { id?: string; answeredAt?: string; sessionId?: string; useInProfile?: boolean; superseded?: boolean };
export interface DiscoveryObservation {
  id: string; attributeKey: string; domain: string;
  kind: DiscoverySignalRule["kind"]; value: string; statement: string; scope: string;
  evidenceIds: string[]; questionIds: string[]; familyIds: string[];
  answeredAt: string | null; strength: "direct" | "indirect";
  state: DiscoveryEvidenceState;
  allowedUses: ("reflection" | "suggest_criterion")[];
  criterion?: { label: string; decisionDomains: string[] };
  opposingEvidenceIds?: string[];
}
export interface DiscoveryInsight {
  id: string; title: string; statement: string; evidenceIds: string[]; questionIds: string[];
  state: DiscoveryEvidenceState; domain: string; attributeKey?: string;
}
export interface DiscoveryExposure { questionId: string; questionVersion?:number; familyId: string; servedAt: string; state: "served" | "answered" | "skipped" | "changed"; domain?: string; daily?:boolean;localDay?:string }
export interface DiscoverySelectionInput {
  answers: DiscoveryAnswer[];
  exposures?: DiscoveryExposure[];
  topic?: DiscoveryDomain | null;
  mutedTopics?: string[];
  forgottenAttributes?: string[];
  suppressedQuestionIds?: string[];
  allowedOptional?: boolean;
  allowText?: boolean;
  maxDepth?: 0 | 1 | 2;
  mode?: "light" | "curious" | "reflect";
  mood?: DiscoveryMood | null;
  localHour?: number;
  sessionAnswers?: number;
  consecutiveSkips?: number;
  continueAfterPause?: boolean;
  learningNeeds?: string[];
  relevantDomains?: string[];
  now?: number;
  random?: () => number;
}
export type DiscoverySelection = { question: DiscoveryQuestion; reason: "explore" | "relevant" | "coverage"; selectorVersion: 1; score: number } | { question: null; reason: "pause" | "exhausted"; selectorVersion: 1; score: 0 };
