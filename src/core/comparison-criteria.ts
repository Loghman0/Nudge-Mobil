/** Explicit user inputs, not AI estimates or verified external facts. */
export interface CriterionValue { value: number | null; sourceUrl?: string; note?: string }
export interface ComparisonCriterion {
  id: string; label: string; unit: string; weight: number;
  direction: "higher" | "lower"; low: number; high: number;
  values: Record<string, CriterionValue>;
  /** Transient confirmation reference; never persisted in public decision context. */
  discoverySuggestion?: { id: string; generation: number };
}
export interface CriteriaContext {
  comparisonBasis?: "journal" | "criteria";
  criteria?: ComparisonCriterion[];
  criteriaConfirmed?: boolean;
  criteriaVersion?: 1;
}
export interface CriteriaAssessment {
  outcome: "winner" | "tie" | "uncertain";
  leader: string | null;
  options: { label: string; low: number; high: number; coverage: number; reasons: string[] }[];
}
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1e12;
const text = (value: unknown, max: number): value is string => typeof value === "string" && value.length <= max;

export function parseCriteria(raw: Record<string, unknown>, labels: string[]): { value?: CriteriaContext; error?: string } {
  if (raw.comparisonBasis === undefined && raw.criteria === undefined && raw.criteriaConfirmed === undefined && raw.criteriaVersion === undefined) return { value: {} };
  if (raw.comparisonBasis !== "journal" && raw.comparisonBasis !== "criteria") return { error: "Choose a valid comparison basis." };
  if (raw.comparisonBasis === "journal") return { value: { comparisonBasis: "journal" } };
  if (raw.criteriaVersion !== undefined && raw.criteriaVersion !== 1) return { error: "This criteria version is unsupported. Copy the comparison and review its inputs." };
  if (raw.criteriaConfirmed !== undefined && typeof raw.criteriaConfirmed !== "boolean") return { error: "Confirm your criteria inputs." };
  if (!Array.isArray(raw.criteria) || raw.criteria.length < 1 || raw.criteria.length > 5) return { error: "Add between one and five criteria." };
  const criteria: ComparisonCriterion[] = [];
  for (const row of raw.criteria) {
    if (!object(row) || !text(row.id, 50) || !/^[a-zA-Z0-9-]+$/.test(row.id) || criteria.some(c => c.id === row.id)
      || !text(row.label, 100) || !row.label.trim() || !text(row.unit, 40)
      || !Number.isInteger(row.weight) || (row.weight as number) < 1 || (row.weight as number) > 5
      || !["higher", "lower"].includes(row.direction as string)
      || !finite(row.low) || !finite(row.high) || row.high <= row.low || !object(row.values)
      || Object.keys(row.values).some(label => !labels.includes(label))) return { error: "Check each criterion's name, range, direction, importance and current options." };
    const values: [string, CriterionValue][] = [];
    for (const label of labels) {
      const cell = Object.hasOwn(row.values,label) ? row.values[label] : { value: null };
      if (!object(cell) || (cell.value !== null && (!finite(cell.value) || cell.value < row.low || cell.value > row.high))
        || (cell.note !== undefined && !text(cell.note, 500)) || (cell.sourceUrl !== undefined && !text(cell.sourceUrl, 2048))) return { error: "Enter values within the stated range, or leave them unknown. Keep notes within 500 characters." };
      const sourceUrl = typeof cell.sourceUrl === "string" ? cell.sourceUrl.trim() : "";
      if (sourceUrl) {
        try { const url = new URL(sourceUrl); if (url.protocol !== "https:" || url.username || url.password) throw new Error(); }
        catch { return { error: "Use a complete HTTPS source link without login credentials." }; }
      }
      values.push([label, { value: cell.value as number | null, ...(sourceUrl ? { sourceUrl } : {}), ...(typeof cell.note === "string" && cell.note.trim() ? { note: cell.note.trim() } : {}) }]);
    }
    let discoverySuggestion: ComparisonCriterion['discoverySuggestion'];
    if(row.discoverySuggestion!==undefined){
      const ref=row.discoverySuggestion;
      if(!object(ref)||Object.keys(ref).length!==2||!text(ref.id,512)||!ref.id||!Number.isSafeInteger(ref.generation)||Number(ref.generation)<0)return {error:'This suggested criterion changed. Remove it or choose the suggestion again.'};
      discoverySuggestion={id:ref.id,generation:Number(ref.generation)};
    }
    criteria.push({ id: row.id, label: row.label.trim(), unit: row.unit.trim(), weight: row.weight as number, direction: row.direction as "higher" | "lower", low: row.low, high: row.high, values:Object.fromEntries(values),...(discoverySuggestion?{discoverySuggestion}:{}) });
  }
  return { value: { comparisonBasis: "criteria", criteria, criteriaConfirmed: raw.criteriaConfirmed === true, criteriaVersion: 1 } };
}

export function withoutDiscoveryReferences(criteria:ComparisonCriterion[]):ComparisonCriterion[]{
  return criteria.map(({discoverySuggestion:_,...criterion})=>criterion);
}

/** Missing measurements span the entire supplied range. No neutral imputation. */
export function assessCriteria(criteria: ComparisonCriterion[], labels: string[]): CriteriaAssessment {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  const options = labels.map(label => {
    let low = 0, unknown = 0;
    const reasons = criteria.map(c => {
      const cell = Object.hasOwn(c.values,label) ? c.values[label] : undefined;
      if (cell?.value == null) { unknown += c.weight; return `${c.label}: unknown (${c.weight}/${total} of importance)`; }
      const fraction = (cell.value - c.low) / (c.high - c.low);
      low += c.weight * (c.direction === "higher" ? fraction : 1 - fraction);
      return `${c.label}: ${cell.value}${c.unit ? ` ${c.unit}` : ""}; ${c.direction} is better; importance ${c.weight}/${total}`;
    });
    return { label, low: low / total, high: (low + unknown) / total, coverage: 1 - unknown / total, reasons };
  });
  const leader = options.find(o => options.every(other => other === o || o.low > other.high + 1e-9));
  const tie = !leader && options.every(o => o.coverage === 1);
  // Preserve input order for ties and uncertainty; no arbitrary first-place winner.
  if (leader) options.sort((a, b) => a === leader ? -1 : b === leader ? 1 : 0);
  return { options, leader: leader?.label ?? null, outcome: leader ? "winner" : tie ? "tie" : "uncertain" };
}

export function criteriaForOptions(criteria: ComparisonCriterion[], labels: string[]): ComparisonCriterion[] {
  return criteria.map(c => ({ ...c, values: Object.fromEntries(labels.map(label => [label, Object.hasOwn(c.values,label) ? c.values[label] : { value: null }])) }));
}
