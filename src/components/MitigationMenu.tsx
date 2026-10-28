import { useCallback } from "react";
import { mitigations } from "@/data/mitigations";
import { useMeshStore } from "@/lib/store";

interface MitigationMenuProps {
  id: string;
  top: number;
  left: number;
  onClose: () => void;
}

const MitigationMenu = ({ id, top, left, onClose }: MitigationMenuProps) => {
  const applyMitigation = useMeshStore((state) => state.applyMitigation);
  const appliedMitigations = useMeshStore((state) => state.appliedMitigations) || [];

  const handleApply = useCallback(
    (mitigationId: string, mitigationName: string) => {
      applyMitigation(id, mitigationId, mitigationName);
      onClose();
    },
    [id, applyMitigation, onClose]
  );

  const alreadyApplied = appliedMitigations
    .filter((m) => m.nodeId === id)
    .map((m) => m.mitigationId);

  return (
    <div
      className="absolute z-[100] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-2 max-h-[450px] overflow-y-auto min-w-[280px]"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-xs font-semibold text-green-400 uppercase border-b border-gray-700 mb-1 sticky top-0 bg-gray-800 flex items-center justify-between">
        <span>Add Mitigation</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">×</button>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 mb-1">
        Double-click node to add mitigations
      </div>
      {mitigations.map((mit) => {
        const applied = alreadyApplied.includes(mit.id);
        return (
          <button
            key={mit.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!applied) {
                handleApply(mit.id, mit.name);
              }
            }}
            disabled={applied}
            className={`w-full text-left px-3 py-2 border-b border-gray-700/50 ${
              applied
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-700 active:bg-gray-600"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-white font-medium">{mit.name}</div>
              {applied && <span className="text-xs text-green-400">✓ Applied</span>}
            </div>
            <div className="text-xs text-gray-400 mb-1">{mit.description}</div>
            <div className="flex gap-2 text-xs">
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
        );
      })}
    </div>
  );
};

export default MitigationMenu;
