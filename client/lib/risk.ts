export type RiskTier = "Low" | "Moderate" | "High" | "Critical";

export interface EntityMetrics {
  id: string;
  complexity_score: number; // 0-100
  robustness_score: number; // 0-100 (higher = safer)
  lead_time_days: number;
  single_source_flag: boolean;
  alt_vendor_count: number;
  geographic_concentration_index: number; // 0-1
  spend_share: number; // 0-1
  criticality_score: number; // 0-100
}

export type Normalizer = (value: number) => number; // returns 0-100

export function createMinMaxNormalizer(values: number[]): Normalizer {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return (v: number) => ((v - min) / range) * 100;
}

export function computeRiskScore(m: EntityMetrics, normalizeLeadTime: Normalizer): number {
  const normalized_lead_time = normalizeLeadTime(m.lead_time_days);
  const risk_score = (0.28 * (100 - m.robustness_score))
    + (0.20 * m.complexity_score)
    + (0.18 * (m.single_source_flag ? 100 : Math.max(0, 60 - 10 * m.alt_vendor_count)))
    + (0.14 * (m.geographic_concentration_index * 100))
    + (0.12 * normalized_lead_time)
    + (0.08 * m.criticality_score);
  return Math.round(Math.min(100, Math.max(0, risk_score)));
}

export function riskTier(score: number): RiskTier {
  if (score <= 34) return "Low";
  if (score <= 59) return "Moderate";
  if (score <= 74) return "High";
  return "Critical";
}

export function riskColor(score: number): string {
  const tier = riskTier(score);
  switch (tier) {
    case "Low": return "hsl(var(--risk-low))";
    case "Moderate": return "hsl(var(--risk-moderate))";
    case "High": return "hsl(var(--risk-high))";
    case "Critical": return "hsl(var(--risk-critical))";
  }
}

export function actionHeuristics(m: EntityMetrics, risk_score: number): string[] {
  const actions: string[] = [];
  if (m.single_source_flag && risk_score >= 60) actions.push("Diversify Vendor Options");
  if (m.complexity_score >= 70 && m.robustness_score <= 40) actions.push("Strategic Redesign Feasibility Study");
  if (m.geographic_concentration_index >= 0.7) actions.push("Regional Rebalancing Initiative");
  if (m.lead_time_days >= 90 && risk_score >= 50) actions.push("Safety Stock Buffer Review");
  if (m.alt_vendor_count === 0 && m.criticality_score >= 70) actions.push("Qualify Alternate Vendors");
  if (m.spend_share >= 0.4 && risk_score >= 50) actions.push("Negotiate Dual-Sourcing Contracts");
  if (m.robustness_score <= 30) actions.push("Supplier Development Program");
  if (m.complexity_score >= 80) actions.push("Design Simplification Assessment");
  return actions;
}
