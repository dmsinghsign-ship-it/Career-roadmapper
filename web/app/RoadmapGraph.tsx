"use client";

import { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type RawNode = {
  id: string | number;
  title?: string;
  phase?: string;
  summary?: string;
  description?: string;
  actionableAdvice?: string;
  interviewQuestion?: string;
  skills?: string[];
  estimated_weeks?: number;
};
type RawEdge = { source: string | number; target: string | number };

const COLORS = ["#dbeafe", "#dcfce7", "#fef9c3", "#fce7f3", "#ede9fe", "#ffedd5"];

export default function RoadmapGraph({ json }: { json: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      const d = JSON.parse(json);
      return {
        rawNodes: (Array.isArray(d.nodes) ? d.nodes : []) as RawNode[],
        rawEdges: (Array.isArray(d.edges) ? d.edges : []) as RawEdge[],
      };
    } catch {
      return null;
    }
  }, [json]);

  const { nodes, edges, byId } = useMemo(() => {
    const byId: Record<string, RawNode> = {};
    if (!parsed) return { nodes: [] as Node[], edges: [] as Edge[], byId };

    const phases: string[] = [];
    const rowInPhase: Record<string, number> = {};

    const nodes: Node[] = parsed.rawNodes.map((n) => {
      const id = String(n.id);
      const phase = n.phase || "Other";
      if (!phases.includes(phase)) phases.push(phase);
      const col = phases.indexOf(phase);
      const row = rowInPhase[phase] ?? 0;
      rowInPhase[phase] = row + 1;
      byId[id] = n;
      return {
        id,
        position: { x: col * 300, y: row * 130 },
        data: { label: n.title || id },
        style: {
          width: 260,
          background: COLORS[col % COLORS.length],
          color: "#111",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 10,
          fontSize: 116,
          fontWeight: 600,
        },
      };
    });

    const edges: Edge[] = parsed.rawEdges
      .filter((e) => byId[String(e.source)] && byId[String(e.target)])
      .map((e, i) => ({
        id: `e${i}`,
        source: String(e.source),
        target: String(e.target),
        markerEnd: { type: MarkerType.ArrowClosed },
      }));

    return { nodes, edges, byId };
  }, [parsed]);

  if (!parsed || nodes.length === 0) {
    return (
      <p role="alert" className="mt-6 text-red-600">
        Could not read the roadmap. Please try again.
      </p>
    );
  }

  const sel = selected ? byId[selected] : null;

  return (
    <div className="mt-6">
      <div
        className="rounded border border-gray-400"
        style={{ height: "80vh", background: "#f8fafc" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
minZoom={0.3}
          nodesDraggable={false}
          onNodeClick={(_, node) => setSelected(node.id)}
          onPaneClick={() => setSelected(null)}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {sel ? (
        <div className="mt-4 rounded bg-white p-4 text-black">
          <h2 className="text-xl font-bold">{sel.title}</h2>
          {sel.phase && <p className="text-sm text-gray-600">{sel.phase}</p>}
          {(sel.summary || sel.description) && (
            <p className="mt-2">{sel.summary || sel.description}</p>
          )}
          {sel.actionableAdvice && (
            <p className="mt-2">
              <b>Do this: </b>
              {sel.actionableAdvice}
            </p>
          )}
          {sel.interviewQuestion && (
            <p className="mt-2">
              <b>Interview question: </b>
              {sel.interviewQuestion}
            </p>
          )}
          {sel.skills && sel.skills.length > 0 && (
            <p className="mt-2">
              <b>Skills: </b>
              {sel.skills.join(", ")}
            </p>
          )}
          {sel.estimated_weeks ? (
            <p className="mt-2">
              <b>Time: </b>~{sel.estimated_weeks} weeks
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          Tap a box to see advice for that step.
        </p>
      )}
    </div>
  );
}