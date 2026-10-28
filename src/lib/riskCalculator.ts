import { RiskFactors, RiskResult, riskMatrix, SeverityLevel, ProbabilityLevel, BarrierEffectiveness } from "@/types/risk";
import { mitigations } from "@/data/mitigations";

export function calculateRisk(factors: Partial<RiskFactors> & { appliedMitigations?: string[] }): RiskResult {
  let severity: SeverityLevel = factors.severity || 2;
  let probability: ProbabilityLevel = factors.probability || 2;
  let barrierEff: BarrierEffectiveness = factors.barrierEffectiveness || 3;

  const breakdown = {
    factors: [] as string[],
    modifiers: [] as string[],
  };

  // Apply modifiers
  const accessDifficulty = factors.accessDifficulty || 0;
  const phaseCriticality = factors.phaseCriticality || 0;
  const fireLoad = factors.fireLoad || 0;
  const detectionDifficulty = factors.detectionDifficulty || 0;

  // Accessibility affects severity and barriers
  if (accessDifficulty > 0.7) {
    severity = Math.min(5, severity + 2) as SeverityLevel;
    barrierEff = Math.max(1, barrierEff - 2) as BarrierEffectiveness;
    breakdown.modifiers.push("Very difficult/inaccessible location (+2 severity, -2 barriers)");
  } else if (accessDifficulty > 0.5) {
    severity = Math.min(5, severity + 1) as SeverityLevel;
    barrierEff = Math.max(1, barrierEff - 1) as BarrierEffectiveness;
    breakdown.modifiers.push("Inaccessible/difficult access (+severity, -barriers)");
  } else if (accessDifficulty > 0.25) {
    breakdown.modifiers.push("Limited access");
  }

  // Critical phases - huge impact
  if (phaseCriticality >= 0.9) {
    severity = Math.min(5, severity + 1) as SeverityLevel;
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("CRITICAL PHASE (takeoff/landing) - limited options for diversion/extinguishment (+severity, +probability)");
  } else if (phaseCriticality >= 0.65) {
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("Taxi/ground movement - reduced mobility/options (+probability)");
  } else if (phaseCriticality >= 0.55) {
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("In-flight - no immediate ground access, limited resources (+probability)");
  } else if (phaseCriticality >= 0.4) {
    // Small increase even for deplaning/boarding
    probability = Math.min(5, probability + 0) as ProbabilityLevel;
  }

  // Fire load (multiple batteries, large device, high Wh)
  if (fireLoad >= 0.8) {
    severity = Math.min(5, severity + 2) as SeverityLevel;
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("Very high fire load (large battery/high energy) (+2 severity, +probability)");
  } else if (fireLoad >= 0.5) {
    severity = Math.min(5, severity + 1) as SeverityLevel;
    breakdown.modifiers.push("Elevated fire load (+severity)");
  }

  // Detection difficulty
  if (detectionDifficulty >= 0.7) {
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    barrierEff = Math.max(1, barrierEff - 1) as BarrierEffectiveness;
    breakdown.modifiers.push("Very difficult to detect/monitor (+probability, -barriers)");
  } else if (detectionDifficulty >= 0.4) {
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("Delayed detection likely (+probability)");
  }

  // Barrier effectiveness affects probability
  if (barrierEff <= 1) {
    probability = Math.min(5, probability + 2) as ProbabilityLevel;
    breakdown.modifiers.push("Barriers absent/ineffective (+2 probability)");
  } else if (barrierEff <= 2) {
    probability = Math.min(5, probability + 1) as ProbabilityLevel;
    breakdown.modifiers.push("Weak barriers (+probability)");
  } else if (barrierEff >= 5) {
    probability = Math.max(1, probability - 1) as ProbabilityLevel;
    breakdown.modifiers.push("Strong barriers (-probability)");
  }

  // Apply mitigations
  let mitigSeverity = severity;
  let mitigProb = probability;
  let mitigBarrier = barrierEff;
  const mitigationEffects: string[] = [];

  if (factors.appliedMitigations && factors.appliedMitigations.length > 0) {
    factors.appliedMitigations.forEach((mitId) => {
      const mit = mitigations.find((m) => m.id === mitId);
      if (mit) {
        if (mit.effect.severityReduction) {
          mitigSeverity = Math.max(1, mitigSeverity - mit.effect.severityReduction) as SeverityLevel;
          mitigationEffects.push(`${mit.name}: -${mit.effect.severityReduction} severity`);
        }
        if (mit.effect.probabilityReduction) {
          mitigProb = Math.max(1, mitigProb - mit.effect.probabilityReduction) as ProbabilityLevel;
          mitigationEffects.push(`${mit.name}: -${mit.effect.probabilityReduction} probability`);
        }
        if (mit.effect.barrierImprovement) {
          mitigBarrier = Math.min(5, mitigBarrier + mit.effect.barrierImprovement) as BarrierEffectiveness;
          mitigationEffects.push(`${mit.name}: +${mit.effect.barrierImprovement} barriers`);
        }
      }
    });
    if (mitigationEffects.length > 0) {
      breakdown.modifiers.push(`MITIGATIONS APPLIED: ${mitigationEffects.join(", ")}`);
    }
  }

  severity = mitigSeverity;
  probability = mitigProb;
  barrierEff = mitigBarrier;

  const riskScore = riskMatrix[severity][probability];
  
  let riskLevel: "Low" | "Medium" | "High" | "Very High";
  let tolerability: "Acceptable" | "Tolerable" | "Intolerable";
  let actionsRequired: string;

  if (riskScore >= 1260 || (severity >= 5 && probability >= 4)) {
    riskLevel = "Very High";
    tolerability = "Intolerable";
    actionsRequired = "IMMEDIATE ACTION REQUIRED - Consider containment measures, flight crew notified immediately. HIGH LIKELIHOOD OF DIVERSION if event escalates. Full SMS escalation.";
  } else if (riskScore >= 315 || (severity >= 4 && probability >= 4)) {
    riskLevel = "High";
    tolerability = "Intolerable";
    actionsRequired = "URGENT - Continuous monitoring required. Be prepared to contain/cool. Flight crew must be notified. Strong consideration for diversion if inaccessible/high energy battery in thermal runaway.";
  } else if (riskScore >= 66 || (severity >= 3 && probability >= 3)) {
    riskLevel = "Medium";
    tolerability = "Tolerable";
    actionsRequired = "ENHANCED MONITORING - Follow crew procedures. Be ready with appropriate response equipment. Assess accessibility and energy level for escalation.";
  } else {
    riskLevel = "Low";
    tolerability = "Acceptable";
    actionsRequired = "MONITOR - Standard awareness. Apply basic precautions per device type.";
  }

  return {
    severity,
    probability,
    barrierEffectiveness: barrierEff,
    riskScore,
    riskLevel,
    tolerability,
    actionsRequired,
    breakdown,
  };
}

export function assessPathRisk(nodes: any[], edges: any[], startNodeId: string, appliedMitigations: string[] = []): RiskResult {
  // Find path from scenario to startNodeId
  const pathNodes: any[] = [];
  const visited = new Set<string>();
  let currentId = startNodeId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const node = nodes.find((n) => n.id === currentId);
    if (!node) break;
    pathNodes.unshift(node);
    if (node.type === "scenarioNode") break;
    const incomers = edges
      .filter((e) => e.target === currentId)
      .map((e) => nodes.find((n) => n.id === e.source))
      .filter(Boolean);
    if (incomers.length === 0) break;
    currentId = incomers[0].id;
  }

  let baseSeverity: SeverityLevel = 2;
  let baseProbability: ProbabilityLevel = 2;
  let barrierEff: BarrierEffectiveness = 3;
  const breakdown = { factors: [] as string[], modifiers: [] as string[] };

  // Analyze scenario
  const scenarioNode = pathNodes.find((n) => n.type === "scenarioNode");
  if (scenarioNode) {
    const scenarioId = scenarioNode.data.scenarioId;
    if (scenarioId?.startsWith("LB-0")) {
      if (["LB-032", "LB-046", "LB-048", "LB-049", "LB-051"].includes(scenarioId)) {
        baseSeverity = 4;
        baseProbability = 3;
        breakdown.factors.push(`Base: ${scenarioId} - Active/emergency scenario`);
      } else if (["LB-011", "LB-020", "LB-024"].includes(scenarioId)) {
        baseSeverity = 3;
        baseProbability = 3;
        breakdown.factors.push(`Base: ${scenarioId} - Inaccessible location scenario`);
      } else if (["LB-023"].includes(scenarioId)) {
        baseSeverity = 3;
        baseProbability = 2;
        breakdown.factors.push(`Base: ${scenarioId} - Device trapped/mechanically compromised`);
      } else {
        baseSeverity = 2;
        baseProbability = 2;
        breakdown.factors.push(`Base: ${scenarioId}`);
      }
    }
  } else {
    // Building from device - start lower
    baseSeverity = 2;
    baseProbability = 2;
    breakdown.factors.push("Custom scenario (built from parameters)");
  }

  let accessDifficulty = 0;
  let phaseCriticality = 0;
  let fireLoad = 0;
  let detectionDifficulty = 0;
  let hasThermalRunaway = false;
  let hasHighWh = false;

  // Analyze parameters
  pathNodes.forEach((node) => {
    if (node.type === "parameterNode" && node.data.category) {
      const cat = node.data.category;
      const val = node.data.value;

      if (cat === "location") {
        breakdown.factors.push(`Location: ${node.data.label}`);
        if (val === "seat_pocket") {
          accessDifficulty += 0.05;
        } else if (val === "aisle") {
          accessDifficulty += 0.15;
        } else if (val === "carry_on_bag") {
          accessDifficulty += 0.2;
        } else if (["lavatory", "flight_deck"].includes(val)) {
          accessDifficulty += 0.35;
        } else if (val === "emergency_exit") {
          accessDifficulty += 0.4;
          breakdown.modifiers.push("Near emergency exit - evacuation impact");
        } else if (val === "between_seats") {
          accessDifficulty += 0.45;
          detectionDifficulty += 0.25;
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Trapped between seats - difficult to access/remove");
        } else if (["overhead_bin", "checked_baggage", "cargo_hold"].includes(val)) {
          accessDifficulty += 0.55;
          detectionDifficulty += 0.15;
        }
      }

      if (cat === "phase") {
        breakdown.factors.push(`Phase: ${node.data.label}`);
        if (["takeoff", "landing"].includes(val)) {
          phaseCriticality = 0.95;
        } else if (["taxi"].includes(val)) {
          phaseCriticality = 0.65;
        } else if (["flight"].includes(val)) {
          phaseCriticality = 0.55;
        } else if (["boarding"].includes(val)) {
          phaseCriticality = 0.35;
        } else if (["deplaning"].includes(val)) {
          phaseCriticality = 0.4;
        } else if (["ground_servicing"].includes(val)) {
          phaseCriticality = 0.45;
        }
      }

      if (cat === "device") {
        breakdown.factors.push(`Device: ${node.data.label}`);
        if (["vape"].includes(val)) {
          fireLoad += 0.08;
        } else if (["phone"].includes(val)) {
          fireLoad += 0.12;
        } else if (["tablet"].includes(val)) {
          fireLoad += 0.18;
        } else if (["laptop", "camera"].includes(val)) {
          fireLoad += 0.32;
        } else if (["powerbank", "drone"].includes(val)) {
          fireLoad += 0.38;
        } else if (["mobility_aid", "smart_luggage"].includes(val)) {
          fireLoad += 0.55;
        } else if (["medical"].includes(val)) {
          fireLoad += 0.28;
        }
      }

      if (cat === "capacity") {
        breakdown.factors.push(`Capacity: ${node.data.label}`);
        if (val === "<20wh") {
          fireLoad += 0.05;
        } else if (val === "20-100wh") {
          fireLoad += 0.25;
          baseSeverity = Math.min(5, baseSeverity + 0) as SeverityLevel;
        } else if (val === "100-160wh") {
          fireLoad += 0.55;
          hasHighWh = true;
          baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
        } else if (val === ">160wh") {
          fireLoad += 0.75;
          hasHighWh = true;
          baseSeverity = Math.min(5, baseSeverity + 2) as SeverityLevel;
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
        } else if (val === "unknown") {
          fireLoad += 0.3;
          detectionDifficulty += 0.2;
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Unknown capacity - treat as elevated risk");
        }
      }

      if (cat === "condition") {
        breakdown.factors.push(`Condition: ${node.data.label}`);
        if (["damaged"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          detectionDifficulty += 0.25;
        }
        if (["trapped"].includes(val)) {
          accessDifficulty += 0.25;
          detectionDifficulty += 0.2;
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
        }
        if (["charging", "powerbank_charging", "aircraft_power"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Charging state increases thermal runaway likelihood");
        }
        if (["overheating"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
        }
        if (["smoke"].includes(val)) {
          hasThermalRunaway = true;
          baseProbability = Math.min(5, baseProbability + 2) as ProbabilityLevel;
          baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
          breakdown.modifiers.push("SMOKE PRESENT - active thermal event");
        }
        if (["thermal_runaway"].includes(val)) {
          hasThermalRunaway = true;
          baseProbability = Math.min(5, baseProbability + 2) as ProbabilityLevel;
          baseSeverity = Math.min(5, baseSeverity + 2) as SeverityLevel;
          barrierEff = Math.max(1, barrierEff - 1) as BarrierEffectiveness;
          breakdown.modifiers.push("THERMAL RUNAWAY - critical event in progress");
        }
        if (["exposed_terminals"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Exposed terminals - short circuit risk");
        }
      }

      if (cat === "quantity") {
        breakdown.factors.push(`Quantity: ${node.data.label}`);
        if (val === "2") {
          fireLoad += 0.3;
        } else if (val === "3+") {
          fireLoad += 0.6;
          baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
        }
      }

      if (cat === "charging") {
        breakdown.factors.push(`Charging: ${node.data.label}`);
        if (["aircraft_power"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Charging from aircraft power increases risk");
        }
        if (["powerbank_charging"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
          breakdown.modifiers.push("Power bank actively charging");
        }
        if (["unintended_activation"].includes(val)) {
          baseProbability = Math.min(5, baseProbability + 1) as ProbabilityLevel;
        }
      }
    }
  });

  accessDifficulty = Math.min(1, accessDifficulty);
  fireLoad = Math.min(1, fireLoad);
  detectionDifficulty = Math.min(1, detectionDifficulty);

  // Additional compounding effects
  if (accessDifficulty > 0.6 && fireLoad > 0.5 && hasThermalRunaway) {
    baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
    barrierEff = Math.max(1, barrierEff - 1) as BarrierEffectiveness;
    breakdown.modifiers.push("COMPOUND: Inaccessible + high fire load + thermal event");
  }

  if (phaseCriticality >= 0.9 && hasThermalRunaway && accessDifficulty > 0.4) {
    baseSeverity = Math.min(5, baseSeverity + 1) as SeverityLevel;
    breakdown.modifiers.push("CRITICAL: Thermal event during critical phase with limited access/options");
  }

  if (hasHighWh && accessDifficulty > 0.5 && ["flight", "takeoff", "landing"].includes(
    pathNodes.find((n) => n.data?.category === "phase")?.data?.value || ""
  )) {
    breakdown.modifiers.push("HIGH ENERGY (>100Wh) in difficult location during flight/critical phase - DIVERSION CONSIDERATION");
  }

  return calculateRisk({
    severity: baseSeverity,
    probability: baseProbability,
    barrierEffectiveness: barrierEff,
    accessDifficulty,
    phaseCriticality,
    fireLoad,
    detectionDifficulty,
    appliedMitigations,
  });
}
