export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type ProbabilityLevel = 1 | 2 | 3 | 4 | 5;
export type BarrierEffectiveness = 1 | 2 | 3 | 4 | 5;

export type FactorCategory =
  | "Base"
  | "Device"
  | "Capacity"
  | "Location"
  | "Phase"
  | "Condition"
  | "Quantity"
  | "Charging"
  | "Compound"
  | "Mitigation"
  | "Other";

export interface FactorRecord {
  key: string;
  category: FactorCategory;
  label: string;
  severityDelta: number;
  probabilityDelta: number;
  barrierDelta: number;
  note?: string;
  compound?: boolean;
}

export interface RiskFactors {
  severity: SeverityLevel;
  probability: ProbabilityLevel;
  barrierEffectiveness: BarrierEffectiveness;
}

export interface RiskResult {
  severity: SeverityLevel;
  probability: ProbabilityLevel;
  barrierEffectiveness: BarrierEffectiveness;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  tolerability: "Acceptable" | "Tolerable" | "Intolerable";
  actionsRequired: string;
  breakdown: {
    factors: FactorRecord[];
  };
}

export const riskMatrix: Record<SeverityLevel, Record<ProbabilityLevel, number>> = {
  1: { 1: 1, 2: 3, 3: 6, 4: 11, 5: 18 },
  2: { 1: 4, 2: 19, 3: 48, 4: 91, 5: 151 },
  3: { 1: 14, 2: 66, 3: 165, 4: 315, 5: 521 },
  4: { 1: 34, 2: 159, 3: 398, 4: 761, 5: 1260 },
  5: { 1: 66, 2: 316, 3: 788, 4: 1510, 5: 2500 },
};
