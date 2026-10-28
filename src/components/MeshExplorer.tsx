"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  getIncomers,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useMeshStore } from "@/lib/store";
import ScenarioNode from "./graph/ScenarioNode";
import ParameterNode from "./graph/ParameterNode";
import ContextMenu from "./graph/ContextMenu";
import MitigationMenu from "./MitigationMenu";
import Sidebar from "./Sidebar";
import RiskPanel from "./RiskPanel";

const nodeTypes = {
  scenarioNode: ScenarioNode,
  parameterNode: ParameterNode,
};

const MeshExplorerInner = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    selectedNodeId,
  } = useMeshStore();

  const [menu, setMenu] = useState<{
    id: string;
    top: number;
    left: number;
    usedCategories: string[];
  } | null>(null);

  const [mitMenu, setMitMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  // Compute highlighted path
  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!selectedNodeId) {
      return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() };
    }
    const nodeSet = new Set<string>();
    const edgeSet = new Set<string>();
    const visited = new Set<string>();
    let currentId = selectedNodeId;

    // Go up to root
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      nodeSet.add(currentId);
      const currentNode = nodes.find((n) => n.id === currentId);
      if (!currentNode || currentNode.type === "scenarioNode") break;
      const incomers = edges
        .filter((e) => e.target === currentId)
        .map((e) => {
          edgeSet.add(e.id);
          return nodes.find((n) => n.id === e.source);
        })
        .filter(Boolean);
      if (incomers.length === 0) break;
      currentId = incomers[0].id;
    }

    return { highlightedNodes: nodeSet, highlightedEdges: edgeSet };
  }, [selectedNodeId, nodes, edges]);

  const getUsedCategoriesAlongPath = useCallback(
    (nodeId: string): string[] => {
      const used: string[] = [];
      const visited = new Set<string>();
      let currentId = nodeId;

      // Walk up to root following incomers
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const currentNode = nodes.find((n) => n.id === currentId);
        if (currentNode?.data?.category) {
          used.push(currentNode.data.category);
        }
        if (currentNode?.type === "scenarioNode") break;
        const incomers = getIncomers(currentNode, nodes, edges);
        if (incomers.length === 0) break;
        currentId = incomers[0].id;
      }
      return used;
    },
    [nodes, edges]
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      event.stopPropagation();

      const usedCategories = getUsedCategoriesAlongPath(node.id);
      const pane = ref.current?.getBoundingClientRect();
      if (pane) {
        setMenu({
          id: node.id,
          top: event.clientY - pane.top,
          left: event.clientX - pane.left,
          usedCategories,
        });
      }
    },
    [getUsedCategoriesAlongPath]
  );

  const onPaneClick = useCallback(() => {
    setMenu(null);
    setMitMenu(null);
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNodeId(node.id);
      setMenu(null);
      setMitMenu(null);
    },
    [setSelectedNodeId]
  );

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      event.preventDefault();
      const pane = ref.current?.getBoundingClientRect();
      if (pane) {
        setMenu(null);
        setMitMenu({
          id: node.id,
          top: event.clientY - pane.top,
          left: event.clientX - pane.left,
        });
        setSelectedNodeId(node.id);
      }
    },
    [setSelectedNodeId]
  );

  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <div className="flex-1 h-full" ref={ref}>
        <ReactFlow
          nodes={nodes.map((node) => ({
            ...node,
            style: highlightedNodes.has(node.id)
              ? { boxShadow: "0 0 0 3px #f59e0b", borderRadius: "8px" }
              : undefined,
          }))}
          edges={edges.map((edge) => ({
            ...edge,
            style: highlightedEdges.has(edge.id)
              ? { stroke: "#f59e0b", strokeWidth: 3 }
              : { stroke: "#4b5563", strokeWidth: 1 },
            animated: highlightedEdges.has(edge.id),
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-950"
        >
          <Background color="#374151" gap={16} />
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap
            className="bg-gray-800 border-gray-700"
            nodeColor={(node) => {
              if (node.type === "scenarioNode") return "#3b82f6";
              if (node.type === "parameterNode") return "#f59e0b";
              return "#6b7280";
            }}
          />
          {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
          {mitMenu && <MitigationMenu {...mitMenu} onClose={() => setMitMenu(null)} />}
        </ReactFlow>
      </div>
      <RiskPanel />
    </div>
  );
};

const MeshExplorer = () => (
  <ReactFlowProvider>
    <MeshExplorerInner />
  </ReactFlowProvider>
);

export default MeshExplorer;
