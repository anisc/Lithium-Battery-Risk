export type NodeType =
  | "scenario"
  | "parameter"
  | "event"
  | "mitigation"
  | "outcome"
  | "risk";

export type ParameterCategory =
  | "device"
  | "capacity"
  | "phase"
  | "location"
  | "condition"
  | "quantity"
  | "charging"
  | "other";

export interface MeshNodeData {
  [key: string]: unknown;
  label: string;
  type: NodeType;
  category?: ParameterCategory;
  description?: string;
  scenarioId?: string;
  value?: string;
  metadata?: Record<string, any>;
}

export interface MeshEdgeData {
  label?: string;
  condition?: string;
  rationale?: string;
}

export interface ScenarioSeed {
  id: string;
  title: string;
  category: string;
  hazard: string;
  proposedControls: string;
  section: string;
}
