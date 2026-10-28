import { useCallback } from "react";
import { parameterCategories } from "@/data/parameters";
import { useMeshStore } from "@/lib/store";

interface ContextMenuProps {
  id: string;
  top: number;
  left: number;
  usedCategories: string[];
  onClose: () => void;
}

const ContextMenu = ({ id, top, left, usedCategories, onClose }: ContextMenuProps) => {
  const addParameterNode = useMeshStore((state) => state.addParameterNode);

  const handleAddParameter = useCallback(
    (category: string, value: string, label: string) => {
      if (usedCategories.includes(category)) {
        return;
      }
      addParameterNode(id, category, value, label);
      onClose();
    },
    [id, addParameterNode, onClose, usedCategories]
  );

  const availableCategories = parameterCategories.filter(
    (cat) => !usedCategories.includes(cat.category)
  );

  return (
    <div
      className="absolute z-[100] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl py-2 max-h-[450px] overflow-y-auto min-w-[260px]"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-300 uppercase border-b border-gray-700 mb-1 sticky top-0 bg-gray-800 flex items-center justify-between">
        <span>Add Branch</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300">×</button>
      </div>
      {availableCategories.length === 0 ? (
        <div className="px-3 py-2 text-xs text-gray-500">
          All parameter types used along this path
        </div>
      ) : (
        availableCategories.map((cat) => (
          <div key={cat.category} className="mb-1">
            <div className="px-3 py-1 text-xs font-medium text-blue-400">
              {cat.label}
            </div>
            {cat.options.map((opt) => (
              <button
                key={`${cat.category}-${opt.value}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddParameter(cat.category, opt.value, opt.label);
                }}
                className="w-full text-left px-4 py-1.5 text-sm text-gray-200 hover:bg-gray-700 active:bg-gray-600 transition-colors"
              >
                {opt.label}
              </button>
            ))}
            <div className="border-b border-gray-700/50 mx-2 my-1"></div>
          </div>
        ))
      )}
    </div>
  );
};

export default ContextMenu;
