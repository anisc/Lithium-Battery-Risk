export interface Mitigation {
  id: string;
  name: string;
  category: string;
  description: string;
  effect: {
    severityReduction?: number;
    probabilityReduction?: number;
    barrierImprovement?: number;
  };
  applicability: string[];
  notes?: string;
}

export const mitigations: Mitigation[] = [
  {
    id: "mit-001",
    name: "Flight Attendant Monitoring",
    category: "Monitoring",
    description: "Increased cabin crew monitoring of the device/location",
    effect: { probabilityReduction: 1, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Early detection improves response time",
  },
  {
    id: "mit-002",
    name: "Acceptance Check at Check-in",
    category: "Prevention",
    description: "Verify device compliance, capacity labeling, and condition",
    effect: { probabilityReduction: 1, barrierImprovement: 1 },
    applicability: ["powerbank", "laptop", "drone", "camera", "smart_luggage"],
    notes: "Prevents non-compliant or damaged devices",
  },
  {
    id: "mit-003",
    name: "Terminal Isolation",
    category: "Prevention",
    description: "Protect battery terminals to prevent short circuit",
    effect: { probabilityReduction: 1, barrierImprovement: 1 },
    applicability: ["spare", "powerbank", "drone"],
    notes: "Use tape/caps as appropriate",
  },
  {
    id: "mit-004",
    name: "Special Storage / Accessible Stowage",
    category: "Containment/Access",
    description: "Move to accessible stowage where possible",
    effect: { probabilityReduction: 1, severityReduction: 0, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Improves access for response",
  },
  {
    id: "mit-005",
    name: "Fire Containment Bag",
    category: "Containment",
    description: "Place device in certified fire containment bag if safe to do so",
    effect: { severityReduction: 1, probabilityReduction: 0, barrierImprovement: 2 },
    applicability: ["phone", "tablet", "vape", "powerbank", "camera"],
    notes: "Effectiveness depends on device size and state. Follow manufacturer/operator guidance.",
  },
  {
    id: "mit-006",
    name: "Fire Gloves (PPE)",
    category: "PPE",
    description: "Use appropriate fire-resistant gloves for handling",
    effect: { barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Protects crew during safe handling",
  },
  {
    id: "mit-007",
    name: "Water/Cooling Measures",
    category: "Cooling",
    description: "Apply water or approved cooling method per procedures",
    effect: { severityReduction: 1, probabilityReduction: 0, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Context-dependent - follow current operator/ICAO guidance",
  },
  {
    id: "mit-008",
    name: "Remove from Charging",
    category: "Prevention",
    description: "Disconnect from aircraft power/power bank",
    effect: { probabilityReduction: 2, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Critical if charging and overheating",
  },
  {
    id: "mit-009",
    name: "Isolate Device",
    category: "Containment",
    description: "Isolate from combustible materials if safe to do so",
    effect: { severityReduction: 1, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Prevents fire spread",
  },
  {
    id: "mit-010",
    name: "Notify Flight Crew Immediately",
    category: "Coordination",
    description: "Immediate notification to flight deck",
    effect: { probabilityReduction: 1, barrierImprovement: 1 },
    applicability: ["all"],
    notes: "Enables diversion/operational decisions",
  },
];
