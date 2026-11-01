"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Alert } from "@/components/ui/alert";
import { CallNodeCard, type CallFlowNode } from "./graph-nodes";
import { countUnconnectedBranches, findNode } from "@/lib/callbooks/graph";
import { outcomeLabel } from "@/lib/callbooks/outcomes";
import type { CallbookGraph } from "@/lib/callbooks/types";

export function GraphCanvas({
  graph,
  selectedNodeId,
  focusedBranchId,
  onSelectNode,
  onFocusBranch,
  onMoveNode,
  onConnectNodes,
}: {
  graph: CallbookGraph;
  selectedNodeId: string | null;
  focusedBranchId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onFocusBranch: (branchId: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  /** Returns an error message when the connection cannot be made. */
  onConnectNodes: (sourceId: string, targetId: string) => string | null;
}) {
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const nodes = useMemo<CallFlowNode[]>(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: "callNode" as const,
        position: node.position,
        selected: node.id === selectedNodeId,
        data: {
          title: node.title,
          script: node.script,
          kind: node.type,
          isStart: node.id === graph.startNodeId,
          branchCount: node.branches.length,
          unconnectedCount: countUnconnectedBranches(node),
          outcomeLabel: node.type === "outcome" ? outcomeLabel(node.outcomeKey) : null,
        },
      })),
    [graph.nodes, graph.startNodeId, selectedNodeId],
  );

  const edges = useMemo<Edge[]>(() => {
    const collected: Edge[] = [];
    for (const node of graph.nodes) {
      for (const branch of node.branches) {
        if (!branch.nextNodeId) continue;
        if (!findNode(graph, branch.nextNodeId)) continue;
        const focused = branch.id === focusedBranchId;
        collected.push({
          id: branch.id,
          source: node.id,
          target: branch.nextNodeId,
          label: branch.label.trim() || "Untitled response",
          type: "smoothstep",
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: "#0f1219", stroke: "#2b3142", strokeWidth: 1 },
          labelStyle: { fill: focused ? "#f5f7ff" : "#a0a8b8", fontSize: 10, fontWeight: 500 },
          style: { stroke: focused ? "#a78bfa" : "#3b4358", strokeWidth: focused ? 2 : 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: focused ? "#a78bfa" : "#3b4358" },
        });
      }
    }
    return collected;
  }, [focusedBranchId, graph]);

  const nodeTypes = useMemo(() => ({ callNode: CallNodeCard }), []);

  const handleNodeClick = useCallback<NodeMouseHandler<CallFlowNode>>(
    (_event, node) => {
      onSelectNode(node.id);
    },
    [onSelectNode],
  );

  const handleEdgeClick = useCallback<EdgeMouseHandler>(
    (_event, edge) => {
      onFocusBranch(edge.id);
    },
    [onFocusBranch],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const error = onConnectNodes(connection.source, connection.target);
      setConnectionError(error);
    },
    [onConnectNodes],
  );

  return (
    <div className="relative h-full min-h-[420px] w-full bg-[#0f1219]">
      {connectionError ? (
        <div className="absolute inset-x-3 top-3 z-10">
          <Alert
            tone="warning"
            title="That connection was not made"
            actions={
              <button
                type="button"
                className="text-[11px] font-medium text-warning underline"
                onClick={() => setConnectionError(null)}
              >
                Dismiss
              </button>
            }
          >
            {connectionError}
          </Alert>
        </div>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        onNodeDragStop={(_event, node) =>
          onMoveNode(node.id, {
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          })
        }
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onPaneClick={() => onSelectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.1 }}
        minZoom={0.25}
        maxZoom={1.8}
        panOnScroll
        proOptions={{ hideAttribution: false }}
        nodesConnectable
        deleteKeyCode={null}
      >
        <Background gap={18} size={1} color="#1e2331" />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}