import { useState } from "react";
import { scenarios } from "@/data/scenarios";
import { useMeshStore } from "@/lib/store";
import { parameterCategories } from "@/data/parameters";

const Sidebar = () => {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"scenarios" | "build">("build");
  const addScenarioNode = useMeshStore((state) => state.addScenarioNode);
  const addParameterNode = useMeshStore((state) => state.addParameterNode);
  const clearMesh = useMeshStore((state) => state.clearMesh);
  const nodes = useMeshStore((state) => state.nodes);

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddScenario = (scenarioId: string) => {
    const position = {
      x: 100 + (nodes.length * 40),
      y: 150 + (nodes.length * 30),
    };
    addScenarioNode(scenarioId, position);
  };

  const handleAddRootParameter = (category: string, value: string, label: string) => {
    const newNodeId = `root-${category}-${value}-${Date.now()}`;
    const position = {
      x: 150,
      y: 200,
    };
    // Add as a root node
    useMeshStore.setState((state) => ({
      nodes: [
        ...state.nodes,
        {
          id: newNodeId,
          type: "parameterNode",
          position,
          data: {
            label: `${label}`,
            type: "parameter",
            category: category as any,
            value: value,
            description: `Start: ${category} = ${label}`,
          },
        },
      ],
    }));
  };

  const deviceCategory = parameterCategories.find((c) => c.category === "device");

  return (
    <div className="w-80 h-full bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-1">
          Lithium Battery Risk Mesh
        </h2>
        <p className="text-xs text-gray-400">Build scenario from parameters</p>
      </div>

      <div className="p-2 border-b border-gray-700 flex gap-1">
        <button
          onClick={() => setMode("build")}
          className={`flex-1 px-2 py-1.5 text-xs rounded ${
            mode === "build"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Build from Device
        </button>
        <button
          onClick={() => setMode("scenarios")}
          className={`flex-1 px-2 py-1.5 text-xs rounded ${
            mode === "scenarios"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          Use Register
        </button>
      </div>

      <div className="p-4 border-b border-gray-700">
        <button
          onClick={clearMesh}
          className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded transition-colors"
        >
          Clear Mesh
        </button>
      </div>

      {mode === "build" && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="text-xs font-semibold text-amber-400 uppercase mb-2">
              Start with a Device
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Build your scenario by adding parameters. Right-click any node to branch.
            </div>
            <div className="space-y-1">
              {deviceCategory?.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAddRootParameter("device", opt.value, opt.label)}
                  className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-amber-500 rounded transition-colors"
                >
                  <div className="text-xs text-white">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 pb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Tips
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Add Capacity (Wh) for accurate risk</div>
              <div>• Add Location (e.g., between seats, overhead bin)</div>
              <div>• Add Phase of flight</div>
              <div>• Add Condition (damaged, trapped, overheating)</div>
              <div>• Each parameter type once per path</div>
            </div>
          </div>
        </div>
      )}

      {mode === "scenarios" && (
        <>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search scenarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Scenario Register ({filteredScenarios.length})
            </div>
            <div className="space-y-2">
              {filteredScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => handleAddScenario(scenario.id)}
                  className="w-full text-left p-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-400">
                      {scenario.id}
                    </span>
                    <span className="text-xs text-gray-500">{scenario.category}</span>
                  </div>
                  <div className="text-xs text-white leading-tight mb-1">
                    {scenario.title}
                  </div>
                  <div className="text-xs text-gray-400 line-clamp-2">
                    {scenario.hazard}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        <div>Right-click a node to add parameters</div>
        <div className="mt-1">Drag nodes to arrange • Select node for risk</div>
      </div>
    </div>
  );
};

export default Sidebar;
