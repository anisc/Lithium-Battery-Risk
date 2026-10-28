import { create } from "zustand";
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
} from "@xyflow/react";
import { MeshNodeData } from "@/types";
import { nanoid } from "nanoid";

interface MitigationApplied {
  nodeId: string;
  mitigationId: string;
  mitigationName: string;
}

interface MeshState {
  nodes: Node<MeshNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  appliedMitigations: MitigationApplied[];
  setNodes: (nodes: Node<MeshNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange<Node<MeshNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addScenarioNode: (scenarioId: string, position?: { x: number; y: number }) => void;
  addParameterNode: (
    parentId: string,
    category: string,
    value: string,
    label: string,
    position?: { x: number; y: number }
  ) => void;
  applyMitigation: (nodeId: string, mitigationId: string, mitigationName: string) => void;
  removeMitigation: (nodeId: string, mitigationId: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  clearMesh: () => void;
}

export const useMeshStore = create<MeshState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  appliedMitigations: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, type: "smoothstep" }, get().edges),
    });
  },

  addScenarioNode: (scenarioId, position) => {
    const { scenarios } = require("@/data/scenarios");
    const scenario = scenarios.find((s: any) => s.id === scenarioId);
    if (!scenario) return;

    const newNode: Node<MeshNodeData> = {
      id: `scenario-${scenarioId}-${nanoid(6)}`,
      type: "scenarioNode",
      position: position || { x: 250, y: 100 },
      data: {
        label: scenario.title,
        type: "scenario",
        scenarioId: scenario.id,
        description: scenario.hazard,
        metadata: scenario,
      },
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  addParameterNode: (parentId, category, value, label, position) => {
    const parentNode = get().nodes.find((n) => n.id === parentId);
    const parentPos = parentNode?.position || { x: 0, y: 0 };

    const newNode: Node<MeshNodeData> = {
      id: `param-${category}-${value}-${nanoid(6)}`,
      type: "parameterNode",
      position: position || { x: parentPos.x + 250, y: parentPos.y },
      data: {
        label: label,
        type: "parameter",
        category: category as any,
        value: value,
        description: `Parameter: ${category} = ${value}`,
      },
    };

    const newEdge: Edge = {
      id: `edge-${parentId}-${newNode.id}`,
      source: parentId,
      target: newNode.id,
      type: "smoothstep",
      label: `${category}: ${value}`,
      animated: false,
    };

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges, newEdge],
    });
  },

  applyMitigation: (nodeId, mitigationId, mitigationName) => {
    const current = get().appliedMitigations || [];
    const exists = current.find(
      (m) => m.nodeId === nodeId && m.mitigationId === mitigationId
    );
    if (exists) return;
    set({
      appliedMitigations: [
        ...current,
        { nodeId, mitigationId, mitigationName },
      ],
    });
  },

  removeMitigation: (nodeId, mitigationId) => {
    const current = get().appliedMitigations || [];
    set({
      appliedMitigations: current.filter(
        (m) => !(m.nodeId === nodeId && m.mitigationId === mitigationId)
      ),
    });
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  clearMesh: () => set({ nodes: [], edges: [], selectedNodeId: null, appliedMitigations: [] }),
}));
