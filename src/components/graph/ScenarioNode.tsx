import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { MeshNodeData } from "@/types";

const ScenarioNode = ({ data, selected }: NodeProps<any>) => {
  const nodeData = data as MeshNodeData;
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-blue-900 border-2 ${
        selected ? "border-blue-400" : "border-blue-700"
      } max-w-[280px]`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
        <div className="text-xs font-semibold text-blue-300 uppercase">
          {nodeData.scenarioId || "Scenario"}
        </div>
      </div>
      <div className="text-sm font-medium text-white leading-tight">
        {nodeData.label}
      </div>
      {nodeData.description && (
        <div className="text-xs text-blue-200 mt-2 line-clamp-2">
          {nodeData.description}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

export default memo(ScenarioNode);
