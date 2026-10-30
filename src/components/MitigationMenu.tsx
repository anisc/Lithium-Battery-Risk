import { useCallback, useMemo } from "react";
import { mitigations } from "@/data/mitigations";
import { useMeshStore } from "@/lib/store";
import { getScopedMitigations } from "@/lib/mitigationScope";

interface MitigationMenuProps {
  id: string;
  top: number;
  left: number;
  onClose: () => void;
}

const MitigationMenu = ({ id, top, left, onClose }: MitigationMenuProps) => {
  const applyMitigation = useMeshStore((state) => state.applyMitigation);
  const removeMitigation = useMeshStore((state) => state.removeMitigation);
  const nodes = useMeshStore((state) => state.nodes);
  const edges = useMeshStore((state) => state.edges);
  const appliedMitigations = useMeshStore((state) => state.appliedMitigations) || [];

  const scoped = useMemo(
    () => getScopedMitigations(nodes, edges, appliedMitigations, id),
    [nodes, edges, appliedMitigations, id]
  );

  const handleApply = useCallback(
    (mitigationId: string, mitigationName: string) => {
      applyMitigation(id, mitigationId, mitigationName);
      onClose();
    },
    [id, applyMitigation, onClose]
  );

  return (
    <div
      className="absolute z-[100] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-2 max-h-[450px] overflow-y-auto min-w-[280px]"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-xs font-semibold text-green-400 uppercase border-b border-gray-700 mb-1 sticky top-0 bg-gray-800 flex items-center justify-between">
        <span>Mitigations</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">×</button>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 mb-1">
        Applies to this node and every branch below it
      </div>
      {mitigations.map((mit) => {
        const active = scoped.find((m) => m.mitigationId === mit.id);
        const inherited = Boolean(active && active.inherited);
        return (
          <div
            key={mit.id}
            className={`px-3 py-2 border-b border-gray-700/50 ${
              active ? "bg-gray-800/60" : "hover:bg-gray-700"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!active) handleApply(mit.id, mit.name);
                }}
                disabled={Boolean(active)}
                className={`text-left flex-1 ${
                  active ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <div className="text-sm text-white font-medium">{mit.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{mit.description}</div>
                <div className="flex gap-2 text-xs mt-1">
                  {mit.effect.severityReduction && (
                    <span className="text-orange-400">-Sev {mit.effect.severityReduction}</span>
                  )}
                  {mit.effect.probabilityReduction && (
                    <span className="text-yellow-400">-Prob {mit.effect.probabilityReduction}</span>
                  )}
                  {mit.effect.barrierImprovement && (
                    <span className="text-green-400">+Barrier {mit.effect.barrierImprovement}</span>
                  )}
                </div>
                {mit.notes && (
                  <div className="text-xs text-gray-500 mt-1 italic">{mit.notes}</div>
                )}
              </button>
              {active && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-green-400">✓ Active</div>
                  <div className="text-[10px] text-gray-500">
                    {inherited ? `from ${active.originLabel}` : "this node"}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeMitigation(active.nodeId, active.mitigationId);
                    }}
                    className="text-[10px] text-red-400 hover:text-red-300 mt-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MitigationMenu;
