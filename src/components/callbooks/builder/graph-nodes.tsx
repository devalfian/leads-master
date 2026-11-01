"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { AlertTriangle, CircleDot } from "lucide-react";
import { cn, truncate } from "@/lib/utils";

export type CallNodeData = {
  title: string;
  script: string;
  kind: "message" | "outcome";
  isStart: boolean;
  branchCount: number;
  unconnectedCount: number;
  outcomeLabel: string | null;
};

export type CallFlowNode = Node<CallNodeData, "callNode">;

function CallNodeCardComponent({ data, selected }: NodeProps<CallFlowNode>) {
  const preview = data.script.trim().length > 0 ? truncate(data.script.trim(), 96) : "No script yet";

  return (
    <div
      className={cn(
        "w-[236px] rounded-[12px] border bg-surface px-3 py-2.5 transition-colors duration-150",
        data.kind === "message" ? "border-accent/45" : "border-success/40",
        selected && "border-accent-soft ring-2 ring-accent-soft/60",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-2 !border-background !bg-[#3b4358]"
      />

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            data.kind === "message" ? "text-accent-soft" : "text-success",
          )}
        >
          {data.kind === "message" ? "Message" : "Outcome"}
        </span>
        {data.isStart ? (
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white">
            START
          </span>
        ) : null}
      </div>

      <p className="mt-1 truncate text-[13px] font-medium text-foreground">
        {data.title.trim() || "Untitled step"}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{preview}</p>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
        <span className="flex items-center gap-1 text-secondary">
          <CircleDot className="size-2.5" aria-hidden="true" />
          {data.kind === "message"
            ? `${data.branchCount} response${data.branchCount === 1 ? "" : "s"}`
            : (data.outcomeLabel ?? "Outcome")}
        </span>
        {data.unconnectedCount > 0 ? (
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="size-2.5" aria-hidden="true" />
            {data.unconnectedCount} unconnected
          </span>
        ) : null}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-2 !border-background !bg-[#3b4358]"
      />
    </div>
  );
}

export const CallNodeCard = memo(CallNodeCardComponent);