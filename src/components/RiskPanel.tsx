import { useMemo } from "react";
import { useMeshStore } from "@/lib/store";
import { assessPathRisk } from "@/lib/riskCalculator";
import { getScopedMitigations } from "@/lib/mitigationScope";

/**
 * Renders a delta cell. For severity/probability a decrease is good; for
 * barriers an increase is good, hence `positiveIsGood`.
 */
const Delta = ({
  value,
  positiveIsGood = false,
}: {
  value: number;
  positiveIsGood?: boolean;
}) => {
  if (!value) return <span className="text-gray-600">·</span>;
  const isGood = positiveIsGood ? value > 0 : value < 0;
  const text = value > 0 ? `+${value}` : `${value}`;
  return (
    <span className={isGood ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
      {text}
    </span>
  );
};

const RiskPanel = () => {
  const nodes = useMeshStore((state) => state.nodes);
  const edges = useMeshStore((state) => state.edges);
  const selectedNodeId = useMeshStore((state) => state.selectedNodeId);
  const appliedMitigations = useMeshStore((state) => state.appliedMitigations);
  const removeMitigation = useMeshStore((state) => state.removeMitigation);

  // Mitigations applied anywhere on this branch carry down to the whole branch.
  const mitigationsForPath = useMemo(() => {
    if (!selectedNodeId) return [];
    return getScopedMitigations(nodes, edges, appliedMitigations, selectedNodeId);
  }, [selectedNodeId, nodes, edges, appliedMitigations]);

  const riskResult = useMemo(() => {
    if (!selectedNodeId) return null;
    const mitIds = mitigationsForPath.map((m) => m.mitigationId);
    return assessPathRisk(nodes, edges, selectedNodeId, mitIds);
  }, [selectedNodeId, nodes, edges, mitigationsForPath]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Very High":
        return "bg-red-900 border-red-600 text-red-200";
      case "High":
        return "bg-orange-900 border-orange-600 text-orange-200";
      case "Medium":
        return "bg-yellow-900 border-yellow-600 text-yellow-200";
      case "Low":
        return "bg-green-900 border-green-600 text-green-200";
      default:
        return "bg-gray-800 border-gray-600 text-gray-200";
    }
  };

  if (!selectedNodeId || !riskResult) {
    return (
      <div className="w-80 h-full bg-gray-900 border-l border-gray-700 p-4">
        <h3 className="text-lg font-bold text-white mb-2">Risk Assessment</h3>
        <p className="text-sm text-gray-400">
          Select a node to assess risk for that path
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-gray-900 border-l border-gray-700 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white mb-1">Risk Assessment</h3>
        <p className="text-xs text-gray-400">Path-based calculation</p>
      </div>

      <div className="p-4">
        <div className={`p-3 rounded border-2 ${getRiskColor(riskResult.riskLevel)}`}>
          <div className="text-center">
            <div className="text-xs uppercase font-semibold mb-1">Risk Level</div>
            <div className="text-2xl font-bold">{riskResult.riskLevel}</div>
            <div className="text-xs mt-1">{riskResult.tolerability}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Matrix Values
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-gray-400">Severity</div>
              <div className="text-white font-bold text-lg">{riskResult.severity}/5</div>
            </div>
            <div>
              <div className="text-gray-400">Probability</div>
              <div className="text-white font-bold text-lg">{riskResult.probability}/5</div>
            </div>
            <div>
              <div className="text-gray-400">Barriers</div>
              <div className="text-white font-bold text-lg">{riskResult.barrierEffectiveness}/5</div>
            </div>
          </div>
          <div className="text-center mt-2 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400">Risk Score</div>
            <div className="text-white font-bold">{riskResult.riskScore}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-gray-400 uppercase">
              Risk Breakdown
            </div>
            <div className="text-[10px] text-gray-500">
              {riskResult.breakdown.factors.length} inputs
            </div>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="text-left font-normal pb-1">Factor</th>
                <th className="text-center font-normal pb-1 w-8" title="Severity">S</th>
                <th className="text-center font-normal pb-1 w-8" title="Probability">P</th>
                <th className="text-center font-normal pb-1 w-8" title="Barriers">B</th>
              </tr>
            </thead>
            <tbody>
              {riskResult.breakdown.factors.map((factor) => {
                const isBase = factor.category === "Base";
                const isMitigation = factor.category === "Mitigation";
                const isCompound = factor.compound;
                return (
                  <tr
                    key={factor.key}
                    className={`align-top border-t border-gray-700/60 ${
                      isBase ? "bg-gray-900/40" : ""
                    }`}
                  >
                    <td className="py-1.5 pr-1">
                      <div
                        className={`leading-tight ${
                          isBase
                            ? "text-blue-300 font-medium"
                            : isMitigation
                              ? "text-green-300"
                              : isCompound
                                ? "text-amber-300 font-medium"
                                : "text-gray-200"
                        }`}
                      >
                        {factor.label}
                      </div>
                      {factor.note && (
                        <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                          {factor.note}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-center">
                      <Delta value={factor.severityDelta} />
                    </td>
                    <td className="py-1.5 text-center">
                      <Delta value={factor.probabilityDelta} />
                    </td>
                    <td className="py-1.5 text-center">
                      <Delta value={factor.barrierDelta} positiveIsGood />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-600 font-semibold">
                <td className="pt-1.5 text-gray-300">Result</td>
                <td className="pt-1.5 text-center text-white">
                  {riskResult.severity}
                </td>
                <td className="pt-1.5 text-center text-white">
                  {riskResult.probability}
                </td>
                <td className="pt-1.5 text-center text-white">
                  {riskResult.barrierEffectiveness}
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500 leading-snug">
            S = severity, P = probability, B = barrier effectiveness (higher is
            better). The scenario is clamped to 1–5 before mitigations are
            applied, so a mitigation always shows its effect even when the
            scenario already saturates the matrix.
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Decision Guidance
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {riskResult.actionsRequired}
          </p>
        </div>

        {mitigationsForPath.length > 0 && (
          <div className="bg-gray-800 p-3 rounded border border-green-700">
            <div className="text-xs font-semibold text-green-400 uppercase mb-2">
              Active Mitigations ({mitigationsForPath.length})
            </div>
            <div className="space-y-2">
              {mitigationsForPath.map((mit) => (
                <div
                  key={`${mit.nodeId}-${mit.mitigationId}`}
                  className="flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="text-xs text-green-300">
                      ✓ {mit.mitigationName}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {mit.inherited ? (
                        <span className="text-amber-400">
                          Inherited from: {mit.originLabel}
                        </span>
                      ) : (
                        <span>Applied on this node</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeMitigation(mit.nodeId, mit.mitigationId)}
                    className="text-xs text-red-400 hover:text-red-300 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-green-900 text-[10px] text-gray-500">
              Mitigations apply to the whole branch below where they are set.
            </div>
          </div>
        )}

        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Quick Guidance
          </div>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• <span className="text-green-400">Small (&lt;20Wh), accessible:</span> Monitor, standard precautions</li>
            <li>• <span className="text-yellow-400">20-100Wh, overheating:</span> Be ready to contain/cool, notify crew</li>
            <li>• <span className="text-orange-400">100-160Wh or inaccessible:</span> Prepare containment bag, continuous monitoring</li>
            <li>• <span className="text-red-400">&gt;160Wh/inaccessible + thermal/smoke:</span> Strong diversion consideration</li>
          </ul>
          <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
            Double-click a node to add mitigations
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskPanel;
