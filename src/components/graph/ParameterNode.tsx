import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { MeshNodeData } from "@/types";

const categoryColors: Record<string, string> = {
  device: "amber",
  phase: "purple",
  location: "cyan",
  condition: "orange",
  quantity: "pink",
  charging: "red",
  other: "gray",
};

const ParameterNode = ({ data, selected }: NodeProps<any>) => {
  const nodeData = data as MeshNodeData;
  const color = categoryColors[nodeData.category || "other"] || "gray";
  
  const colorClasses: Record<string, any> = {
    amber: { border: selected ? "border-amber-400" : "border-amber-700", bg: "bg-amber-900", dot: "bg-amber-400", text: "text-amber-300" },
    purple: { border: selected ? "border-purple-400" : "border-purple-700", bg: "bg-purple-900", dot: "bg-purple-400", text: "text-purple-300" },
    cyan: { border: selected ? "border-cyan-400" : "border-cyan-700", bg: "bg-cyan-900", dot: "bg-cyan-400", text: "text-cyan-300" },
    orange: { border: selected ? "border-orange-400" : "border-orange-700", bg: "bg-orange-900", dot: "bg-orange-400", text: "text-orange-300" },
    pink: { border: selected ? "border-pink-400" : "border-pink-700", bg: "bg-pink-900", dot: "bg-pink-400", text: "text-pink-300" },
    red: { border: selected ? "border-red-400" : "border-red-700", bg: "bg-red-900", dot: "bg-red-400", text: "text-red-300" },
    gray: { border: selected ? "border-gray-400" : "border-gray-700", bg: "bg-gray-900", dot: "bg-gray-400", text: "text-gray-300" },
  };
  
  const classes = colorClasses[color];
  
  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg ${classes.bg} border-2 ${classes.border} max-w-[240px]`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${classes.dot}`}></div>
        <div className={`text-xs font-semibold ${classes.text} uppercase`}>
          {nodeData.category || "Parameter"}
        </div>
      </div>
      <div className="text-sm font-medium text-white leading-tight">
        {nodeData.label}
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  );
};

export default memo(ParameterNode);
