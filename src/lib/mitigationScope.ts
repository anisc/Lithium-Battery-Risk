import { Edge, Node } from "@xyflow/react";
import { MeshNodeData } from "@/types";

export interface AppliedMitigation {
  nodeId: string;
  mitigationId: string;
  mitigationName: string;
}

export interface ScopedMitigation extends AppliedMitigation {
  originLabel: string;
  inherited: boolean;
}

function buildParentMap(edges: Edge[]): Map<string, string> {
  const parents = new Map<string, string>();
  edges.forEach((edge) => {
    // First incoming edge wins; the mesh is branched as a tree.
    if (!parents.has(edge.target)) {
      parents.set(edge.target, edge.source);
    }
  });
  return parents;
}

/** Node ids from the root of the branch down to (and including) nodeId. */
export function getPathNodeIds(
  nodes: Node<MeshNodeData>[],
  edges: Edge[],
  nodeId: string
): string[] {
  const parents = buildParentMap(edges);
  const path: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = nodeId;

  while (current && !seen.has(current)) {
    seen.add(current);
    path.unshift(current);
    current = parents.get(current);
  }

  return path;
}

/**
 * Mitigations that are in force for a node. A mitigation applied on any node
 * of the branch also applies to every node below it, so the whole branch
 * inherits the effect.
 */
export function getScopedMitigations(
  nodes: Node<MeshNodeData>[],
  edges: Edge[],
  appliedMitigations: AppliedMitigation[] | undefined,
  nodeId: string
): ScopedMitigation[] {
  if (!appliedMitigations || appliedMitigations.length === 0) return [];

  const pathIds = getPathNodeIds(nodes, edges, nodeId);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  const scoped: ScopedMitigation[] = [];

  pathIds.forEach((pathNodeId) => {
    appliedMitigations
      .filter((m) => m.nodeId === pathNodeId)
      .forEach((m) => {
        const key = `${pathNodeId}:${m.mitigationId}`;
        if (seen.has(key)) return;
        seen.add(key);
        scoped.push({
          ...m,
          originLabel: nodeById.get(pathNodeId)?.data?.label ?? "Unknown node",
          inherited: pathNodeId !== nodeId,
        });
      });
  });

  return scoped;
}

export interface MitigationCounts {
  own: number;
  inherited: number;
}

/** Per-node mitigation counts, used to badge nodes on the canvas. */
export function getMitigationCounts(
  nodes: Node<MeshNodeData>[],
  edges: Edge[],
  appliedMitigations: AppliedMitigation[] | undefined
): Record<string, MitigationCounts> {
  const counts: Record<string, MitigationCounts> = {};
  if (!appliedMitigations) return counts;

  nodes.forEach((node) => {
    const scoped = getScopedMitigations(nodes, edges, appliedMitigations, node.id);
    counts[node.id] = {
      own: scoped.filter((m) => !m.inherited).length,
      inherited: scoped.filter((m) => m.inherited).length,
    };
  });

  return counts;
}
