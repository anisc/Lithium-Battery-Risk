import {
  BarrierEffectiveness,
  FactorRecord,
  ProbabilityLevel,
  RiskResult,
  SeverityLevel,
  riskMatrix,
} from "@/types/risk";
import { mitigations } from "@/data/mitigations";
import { getPathNodeIds } from "@/lib/mitigationScope";

const clampLevel = (value: number) => Math.max(1, Math.min(5, value));

const DEVICE_FIRE_LOAD: Record<string, number> = {
  vape: 0.08,
  phone: 0.12,
  tablet: 0.18,
  medical: 0.28,
  laptop: 0.32,
  camera: 0.32,
  powerbank: 0.38,
  drone: 0.38,
  mobility_aid: 0.55,
  smart_luggage: 0.55,
};

const DEVICE_NOTES: Record<string, string> = {
  vape: "Small cell, but often carried loose and activated by accident",
  phone: "Small sealed cell, limited energy for propagation",
  tablet: "Mid-size pouch cell, sustained flame possible",
  laptop: "Multiple cells, can propagate internally",
  powerbank: "Bare cells in a pack, no device enclosure to slow propagation",
  drone: "High-discharge pack, intense but usually short event",
  mobility_aid: "Large pack, highest available energy of passenger items",
  smart_luggage: "Large pack inside a bag, often inaccessible",
  camera: "High-drain pack, moderate energy",
  medical: "Small pack but loss of function is a secondary hazard",
};

const CAPACITY_FIRE_LOAD: Record<string, number> = {
  "<20wh": 0.05,
  "20-100wh": 0.25,
  "100-160wh": 0.55,
  ">160wh": 0.75,
  unknown: 0.3,
};

interface BuildState {
  severity: number;
  probability: number;
  barrier: number;
  records: FactorRecord[];
  fireLoad: number;
  fireContributors: string[];
  thermalEvent: boolean;
  heatEvent: boolean;
  inaccessible: boolean;
  highEnergy: boolean;
  veryHighEnergy: boolean;
  inFlightPhase: boolean;
  criticalPhase: boolean;
  diversionIndicated: boolean;
}

function pushRecord(state: BuildState, record: FactorRecord, apply = true) {
  state.records.push(record);
  if (!apply) return;
  state.severity += record.severityDelta;
  state.probability += record.probabilityDelta;
  state.barrier += record.barrierDelta;
}

export function assessPathRisk(
  nodes: any[],
  edges: any[],
  startNodeId: string,
  appliedMitigationIds: string[] = []
): RiskResult {
  const pathIds = getPathNodeIds(nodes, edges, startNodeId);
  const pathNodes = pathIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
  const scenarioNode = pathNodes.find((n) => n.type === "scenarioNode");

  const state: BuildState = {
    severity: 2,
    probability: 2,
    barrier: 3,
    records: [],
    fireLoad: 0,
    fireContributors: [],
    thermalEvent: false,
    heatEvent: false,
    inaccessible: false,
    highEnergy: false,
    veryHighEnergy: false,
    inFlightPhase: false,
    criticalPhase: false,
    diversionIndicated: false,
  };

  // ---- Base -------------------------------------------------------------
  const scenarioId: string | undefined = scenarioNode?.data?.scenarioId;
  let baseNote = "Custom scenario built from parameters";
  if (scenarioId?.startsWith("LB-0")) {
    if (["LB-032", "LB-046", "LB-048", "LB-049", "LB-051"].includes(scenarioId)) {
      state.severity = 4;
      state.probability = 3;
      baseNote = `${scenarioId} — register scenario with an active or high-consequence event`;
    } else if (["LB-011", "LB-020", "LB-024"].includes(scenarioId)) {
      state.severity = 3;
      state.probability = 3;
      baseNote = `${scenarioId} — register scenario with an inaccessible device`;
    } else if (scenarioId === "LB-023") {
      state.severity = 3;
      state.probability = 2;
      baseNote = `${scenarioId} — register scenario, device mechanically compromised`;
    } else {
      state.severity = 2;
      state.probability = 2;
      baseNote = `${scenarioId} — register scenario`;
    }
  }

  state.records.push({
    key: "base",
    category: "Base",
    label: scenarioId ? `${scenarioId} base risk` : "Custom scenario base",
    severityDelta: state.severity,
    probabilityDelta: state.probability,
    barrierDelta: 0,
    note: `${baseNote}. Starting point for the branch.`,
  });

  // ---- Parameters -------------------------------------------------------
  pathNodes.forEach((node: any) => {
    if (node.type !== "parameterNode") return;
    const category: string = node.data?.category;
    const value: string = node.data?.value;
    const label: string = node.data?.label ?? value;
    const key = node.id;

    if (category === "device") {
      const load = DEVICE_FIRE_LOAD[value] ?? 0.2;
      state.fireLoad += load;
      state.fireContributors.push(label);

      let sev = 0;
      if (["mobility_aid", "smart_luggage"].includes(value)) {
        sev = 1;
        state.highEnergy = true;
      }

      pushRecord(state, {
        key,
        category: "Device",
        label: `Device: ${label}`,
        severityDelta: sev,
        probabilityDelta: 0,
        barrierDelta: 0,
        note: `${DEVICE_NOTES[value] ?? "Device energy class considered"}. Fire load +${load.toFixed(2)}.`,
      });
      return;
    }

    if (category === "capacity") {
      const load = CAPACITY_FIRE_LOAD[value] ?? 0.25;
      state.fireLoad += load;
      state.fireContributors.push(label);

      let sev = 0;
      let prob = 0;
      let bar = 0;
      let note = `Fire load +${load.toFixed(2)}.`;

      if (value === "100-160wh") {
        sev = 1;
        bar = -1;
        state.highEnergy = true;
        note =
          "Above 100 Wh: a sustained event, and too large for many containment bags. Harder to control.";
      } else if (value === ">160wh") {
        sev = 1;
        prob = 1;
        bar = -1;
        state.highEnergy = true;
        state.veryHighEnergy = true;
        note =
          "Above 160 Wh: expect a long, intense event that suppression on board will not reliably stop.";
      } else if (value === "unknown") {
        prob = 1;
        note = "Capacity unconfirmed — treated as elevated risk.";
      } else if (value === "<20wh") {
        note = "Small energy: limited fuel, short event typical.";
      } else {
        note = "Common PED/power bank energy band.";
      }

      pushRecord(state, {
        key,
        category: "Capacity",
        label: `Capacity: ${label}`,
        severityDelta: sev,
        probabilityDelta: prob,
        barrierDelta: bar,
        note,
      });
      return;
    }

    if (category === "location") {
      let sev = 0;
      let prob = 0;
      let bar = 0;
      let note = "Accessible location.";

      if (value === "between_seats") {
        prob = 1;
        bar = -1;
        state.inaccessible = true;
        note = "Trapped: seats must be moved before the device can be reached or removed.";
      } else if (value === "overhead_bin") {
        sev = 1;
        bar = -1;
        state.inaccessible = true;
        note = "Not immediately visible or reachable; smoke can spread inside the bin first.";
      } else if (value === "checked_baggage" || value === "cargo_hold") {
        sev = 1;
        bar = -2;
        state.inaccessible = true;
        note = "No crew access in flight; detection is late and response is limited to suppression systems.";
      } else if (value === "lavatory") {
        bar = -1;
        note = "Confined space, smoke detection only, crew must open the door to intervene.";
      } else if (value === "flight_deck") {
        bar = -1;
        note = "Crew access is immediate but any distraction affects aircraft control.";
      } else if (value === "emergency_exit") {
        sev = 1;
        note = "Response or evacuation can obstruct an exit, raising the consequence.";
      } else if (value === "carry_on_bag") {
        note = "Inside a bag: retrieval takes time and may be blocked by other items.";
      } else if (value === "seat_pocket") {
        note = "Within reach of the passenger and crew; fastest possible intervention.";
      } else if (value === "aisle") {
        note = "Accessible but in the evacuation path.";
      }

      pushRecord(state, {
        key,
        category: "Location",
        label: `Location: ${label}`,
        severityDelta: sev,
        probabilityDelta: prob,
        barrierDelta: bar,
        note,
      });
      return;
    }

    if (category === "phase") {
      let sev = 0;
      let prob = 0;
      let note = "Aircraft on the ground with external support available.";

      if (value === "flight") {
        prob = 1;
        state.inFlightPhase = true;
        note = "No ground access. Response relies only on what is carried on board.";
      } else if (value === "takeoff" || value === "landing") {
        sev = 1;
        prob = 1;
        state.inFlightPhase = true;
        state.criticalPhase = true;
        note = "Critical phase: crew are seat-locked and the aircraft cannot divert or stop immediately.";
      } else if (value === "taxi") {
        note = "Ground phase: the aircraft can stop and fire services can reach it.";
      } else if (value === "boarding") {
        note = "Ground phase: the device can be removed from the aircraft before departure.";
      } else if (value === "deplaning") {
        note = "Ground phase with passengers moving; exit obstruction is the main concern.";
      } else if (value === "ground_servicing") {
        note = "Ground crew exposed, but fire services and equipment are immediately available.";
      }

      pushRecord(state, {
        key,
        category: "Phase",
        label: `Phase: ${label}`,
        severityDelta: sev,
        probabilityDelta: prob,
        barrierDelta: 0,
        note,
      });
      return;
    }

    if (category === "condition") {
      let sev = 0;
      let prob = 0;
      let bar = 0;
      let note = "No escalation indicators.";

      if (value === "damaged") {
        prob = 1;
        note = "Physical damage can create an internal short with no external sign until runaway starts.";
      } else if (value === "trapped") {
        prob = 1;
        bar = -1;
        state.inaccessible = true;
        note = "Mechanical load on the cell plus inability to remove it.";
      } else if (value === "charging") {
        prob = 1;
        note = "Active charging adds heat and current during the event.";
      } else if (value === "exposed_terminals") {
        prob = 1;
        note = "Short circuit risk from contact with metal objects.";
      } else if (value === "overheating") {
        prob = 1;
        state.heatEvent = true;
        note = "Heat is rising but there is no smoke yet — the point where intervention can still work.";
      } else if (value === "smoke") {
        sev = 1;
        prob = 2;
        bar = -1;
        state.heatEvent = true;
        state.thermalEvent = true;
        note = "Thermal runaway under way. Smoke is toxic and can fill the cabin quickly.";
      } else if (value === "thermal_runaway") {
        sev = 2;
        prob = 2;
        bar = -1;
        state.heatEvent = true;
        state.thermalEvent = true;
        note = "Cells venting and propagating. Expect re-ignition after extinguishment.";
      }

      pushRecord(state, {
        key,
        category: "Condition",
        label: `Condition: ${label}`,
        severityDelta: sev,
        probabilityDelta: prob,
        barrierDelta: bar,
        note,
      });
      return;
    }

    if (category === "quantity") {
      const load = value === "3+" ? 0.6 : value === "2" ? 0.3 : 0;
      if (load > 0) {
        state.fireLoad += load;
        state.fireContributors.push(label);
      }
      pushRecord(state, {
        key,
        category: "Quantity",
        label: `Quantity: ${label}`,
        severityDelta: value === "3+" ? 1 : 0,
        probabilityDelta: 0,
        barrierDelta: 0,
        note:
          value === "3+"
            ? "Multiple packs: one event can trigger the next. Fire load +0.60."
            : value === "2"
              ? "Two packs double the available fuel. Fire load +0.30."
              : "Single pack.",
      });
      return;
    }

    if (category === "charging") {
      let prob = 0;
      let note = "No active charging.";
      if (value === "aircraft_power") {
        prob = 1;
        note = "Charging from aircraft power: heat plus a continuous energy source.";
      } else if (value === "powerbank_charging") {
        prob = 1;
        note = "Power bank under load while charging another device.";
      } else if (value === "unintended_activation") {
        prob = 1;
        note = "Device running unnoticed inside a bag.";
      }
      pushRecord(state, {
        key,
        category: "Charging",
        label: `Charging: ${label}`,
        severityDelta: 0,
        probabilityDelta: prob,
        barrierDelta: 0,
        note,
      });
      return;
    }

    pushRecord(state, {
      key,
      category: "Other",
      label,
      severityDelta: 0,
      probabilityDelta: 0,
      barrierDelta: 0,
      note: "Recorded but no scoring rule applies.",
    });
  });

  // ---- Compound effects -------------------------------------------------
  if (state.fireLoad >= 1.0) {
    pushRecord(state, {
      key: "fire-load",
      category: "Compound",
      label: `Accumulated fire load ${state.fireLoad.toFixed(2)}`,
      severityDelta: 1,
      probabilityDelta: 0,
      barrierDelta: 0,
      compound: true,
      note: `Above the 1.00 threshold — more fuel than a single device. Inputs: ${state.fireContributors.join(", ")}.`,
    });
  }

  if (state.thermalEvent && state.inaccessible) {
    pushRecord(state, {
      key: "thermal-inaccessible",
      category: "Compound",
      label: "Thermal event in an inaccessible location",
      severityDelta: 0,
      probabilityDelta: 1,
      barrierDelta: 0,
      compound: true,
      note: "Cooling and containment cannot be applied promptly, so the event is left to develop.",
    });
  }

  if (state.veryHighEnergy && state.heatEvent) {
    pushRecord(state, {
      key: "very-high-energy",
      category: "Compound",
      label: "Very high energy pack already heating",
      severityDelta: 1,
      probabilityDelta: 0,
      barrierDelta: 0,
      compound: true,
      note: "Packs above 160 Wh are expected to propagate once heating starts; treat the outcome as a fire, not a device fault.",
    });
  }

  if (state.heatEvent && state.highEnergy && (state.inFlightPhase || state.criticalPhase)) {
    state.diversionIndicated = true;
    pushRecord(
      state,
      {
        key: "diversion",
        category: "Compound",
        label: "Diversion trigger",
        severityDelta: 0,
        probabilityDelta: 0,
        barrierDelta: 0,
        compound: true,
        note: "High energy already heating in flight: the available suppression is unlikely to stop propagation. Treat diversion as an active option.",
      },
      false
    );
  }

  if (state.thermalEvent && state.criticalPhase) {
    pushRecord(state, {
      key: "critical-phase",
      category: "Compound",
      label: "Thermal event during a critical phase",
      severityDelta: 1,
      probabilityDelta: 0,
      barrierDelta: 0,
      compound: true,
      note: "Take-off or landing: crew cannot leave their stations to assist.",
    });
  }

  // Scenario factors saturate at the matrix bounds before mitigations, so a
  // mitigation is always able to show a benefit.
  state.severity = clampLevel(state.severity);
  state.probability = clampLevel(state.probability);
  state.barrier = clampLevel(state.barrier);

  // ---- Mitigations ------------------------------------------------------
  appliedMitigationIds.forEach((mitigationId) => {
    const mitigation = mitigations.find((m) => m.id === mitigationId);
    if (!mitigation) return;
    pushRecord(state, {
      key: `mit-${mitigationId}`,
      category: "Mitigation",
      label: mitigation.name,
      severityDelta: -(mitigation.effect.severityReduction ?? 0),
      probabilityDelta: -(mitigation.effect.probabilityReduction ?? 0),
      barrierDelta: mitigation.effect.barrierImprovement ?? 0,
      note: mitigation.notes ?? mitigation.description,
    });
    state.severity = clampLevel(state.severity);
    state.probability = clampLevel(state.probability);
    state.barrier = clampLevel(state.barrier);
  });

  // ---- Barrier effect on probability ------------------------------------
  if (state.barrier <= 2) {
    pushRecord(state, {
      key: "barrier-penalty",
      category: "Compound",
      label: "Barriers weak or absent",
      severityDelta: 0,
      probabilityDelta: 1,
      barrierDelta: 0,
      compound: true,
      note: "With barrier effectiveness at 1–2, the undesired outcome is more likely to develop unchecked.",
    });
  } else if (state.barrier >= 4) {
    pushRecord(state, {
      key: "barrier-bonus",
      category: "Compound",
      label: "Barriers strong",
      severityDelta: 0,
      probabilityDelta: -1,
      barrierDelta: 0,
      compound: true,
      note: "With barrier effectiveness at 4–5, the outcome is less likely to develop.",
    });
  }

  const severity = clampLevel(state.severity) as SeverityLevel;
  const probability = clampLevel(state.probability) as ProbabilityLevel;
  const barrierEffectiveness = clampLevel(state.barrier) as BarrierEffectiveness;
  const riskScore = riskMatrix[severity][probability];

  let riskLevel: "Low" | "Medium" | "High" | "Very High";
  let tolerability: "Acceptable" | "Tolerable" | "Intolerable";
  let actionsRequired: string;

  if (riskScore >= 1260 || (severity >= 5 && probability >= 4)) {
    riskLevel = "Very High";
    tolerability = "Intolerable";
    actionsRequired =
      "IMMEDIATE ACTION REQUIRED — contain or cool if it can be done safely, notify the flight crew at once, and plan for the event to continue. Full SMS escalation.";
  } else if (riskScore >= 315 || (severity >= 4 && probability >= 4)) {
    riskLevel = "High";
    tolerability = "Intolerable";
    actionsRequired =
      "URGENT — continuous monitoring, response equipment ready, flight crew notified. Be prepared to contain and cool, and assess whether the event can be stopped on board.";
  } else if (riskScore >= 66 || (severity >= 3 && probability >= 3)) {
    riskLevel = "Medium";
    tolerability = "Tolerable";
    actionsRequired =
      "ENHANCED MONITORING — follow crew procedures, keep response equipment within reach, and watch for escalation to smoke or sustained heat.";
  } else {
    riskLevel = "Low";
    tolerability = "Acceptable";
    actionsRequired =
      "MONITOR — standard awareness and basic precautions for the device type.";
  }

  if (
    state.diversionIndicated &&
    (riskLevel === "High" || riskLevel === "Very High")
  ) {
    actionsRequired +=
      " DIVERSION CONSIDERATION: high energy source already heating with no reliable means of stopping propagation on board.";
  }

  return {
    severity,
    probability,
    barrierEffectiveness,
    riskScore,
    riskLevel,
    tolerability,
    actionsRequired,
    breakdown: { factors: state.records },
  };
}
