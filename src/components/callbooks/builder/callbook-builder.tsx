"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  CheckCircle2,
  Eye,
  Loader2,
  Phone,
  Rocket,
  RotateCcw,
  Save,
  Settings2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/layout/page-header";
import { StartCallDialog } from "@/components/callbooks/start-call-dialog";
import { CallbookStatusBadge, UnpublishedChangesBadge } from "@/components/callbooks/status-badges";
import { GraphCanvas } from "./graph-canvas";
import { NodeInspector } from "./node-inspector";
import { BuilderTools } from "./builder-tools";
import { ChecksDialog } from "./checks-dialog";
import { CallbookSettingsDialog } from "./callbook-settings-dialog";
import { useCallbookDraft } from "./use-callbook-draft";
import {
  addNode,
  appendBranch,
  connectBranch,
  createBranch,
  createMessageNode,
  createOutcomeNode,
  deleteNode,
  findNode,
  moveBranch,
  moveNode,
  removeBranch,
  setStartNode,
  updateBranch,
  updateNode,
} from "@/lib/callbooks/graph";
import type { Callbook, CallbookMarketOption } from "@/lib/callbooks/types";
import { cn, formatRelative } from "@/lib/utils";

type MobileTab = "steps" | "canvas" | "inspector";

export function CallbookBuilder({
  callbook,
  markets,
  contextSessionId,
  leadId,
}: {
  callbook: Callbook;
  markets: CallbookMarketOption[];
  contextSessionId: string | null;
  leadId: string | null;
}) {
  const draft = useCallbookDraft(callbook);
  const { state } = draft;

  const [mobileTab, setMobileTab] = useState<MobileTab>("canvas");
  const [checksOpen, setChecksOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startCallOpen, setStartCallOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const selectedNodeId = state.selectedNodeId;
  const archived = state.status === "archived";
  const canStartCall = state.hasPublishedSnapshot && !archived;

  function addMessage() {
    const node = createMessageNode(state.graph);
    draft.apply((graph) => addNode(graph, node));
    draft.selectNode(node.id);
    setMobileTab("inspector");
  }

  function addOutcome() {
    const node = createOutcomeNode(state.graph);
    draft.apply((graph) => addNode(graph, node));
    draft.selectNode(node.id);
    setMobileTab("inspector");
  }

  function addResponse() {
    if (!selectedNodeId) return;
    const node = findNode(state.graph, selectedNodeId);
    if (!node) return;
    const branch = createBranch(node);
    draft.apply((graph) => appendBranch(graph, selectedNodeId, branch));
    draft.focusBranch(branch.id);
  }

  function createNextStep(branchId: string) {
    if (!selectedNodeId) return;
    const node = findNode(state.graph, selectedNodeId);
    if (!node) return;

    const created = createMessageNode(state.graph, {
      x: node.position.x + 320,
      y: node.position.y + node.branches.length * 40,
    });
    const withNode = addNode(state.graph, created);
    const linked = connectBranch(withNode, selectedNodeId, branchId, created.id);
    draft.apply(() => (linked.ok ? linked.graph : withNode));
    draft.selectNode(created.id);
    setMobileTab("inspector");
  }

  function handleCanvasConnect(sourceId: string, targetId: string): string | null {
    const source = findNode(state.graph, sourceId);
    if (!source) return "That step no longer exists.";
    if (source.type === "outcome") {
      return "Outcome steps end the path — they cannot have prospect responses.";
    }

    const unconnected = source.branches.filter((branch) => !branch.nextNodeId);
    if (unconnected.length === 0) {
      return "Add a response on this step first, then connect it to another step.";
    }
    if (unconnected.length > 1) {
      return "This step has more than one unconnected response. Choose which response goes where in the inspector.";
    }

    const branch = unconnected[0];
    if (!branch) return "That response no longer exists.";
    const result = connectBranch(state.graph, sourceId, branch.id, targetId);
    if (!result.ok) return result.error;

    draft.apply(() => result.graph);
    draft.focusBranch(branch.id);
    return null;
  }

  async function handlePublish() {
    setPublishing(true);
    const published = await draft.publish();
    setPublishing(false);
    if (!published) setChecksOpen(true);
  }

  const saveLabel =
    state.saveState === "saving"
      ? "Saving…"
      : state.saveState === "dirty"
        ? "Unsaved changes"
        : state.saveState === "error"
          ? "Save failed"
          : "All changes saved";

  return (
    <div className="flex min-h-[85vh] flex-col lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="border-b border-border-subtle">
        <PageHeader
          className="border-b-0 pb-4"
          breadcrumb={[
            { label: "Workspace" },
            { label: "Call Playbooks", href: "/callbooks" },
            { label: state.meta.title || "Untitled Callbook" },
          ]}
          title={state.meta.title || "Untitled Callbook"}
          description={state.meta.targetAudience || "No target audience set"}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <CallbookStatusBadge status={state.status} />
              {state.hasPublishedSnapshot ? (
                <Badge tone="info">v{state.publishedVersion}</Badge>
              ) : null}
              {state.hasUnpublishedChanges && state.hasPublishedSnapshot ? (
                <UnpublishedChangesBadge />
              ) : null}
            </div>
          }
          actions={
            <>
              <span
                className={cn(
                  "mr-1 hidden items-center gap-1.5 text-[12px] sm:inline-flex",
                  state.saveState === "error"
                    ? "text-danger"
                    : state.saveState === "dirty"
                      ? "text-warning"
                      : "text-muted",
                )}
              >
                {state.saveState === "saving" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : state.saveState === "error" ? (
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                )}
                {saveLabel}
                {state.saveState === "saved" && state.lastSavedAt ? (
                  <span className="text-muted"> · {formatRelative(state.lastSavedAt)}</span>
                ) : null}
              </span>

              <Button
                variant="ghost"
                size="icon"
                title="Callbook settings"
                aria-label="Callbook settings"
                onClick={() => setSettingsOpen(true)}
                disabled={archived}
              >
                <Settings2 aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title={archived ? "Restore Callbook" : "Archive Callbook"}
                aria-label={archived ? "Restore Callbook" : "Archive Callbook"}
                onClick={() => void draft.toggleArchive()}
              >
                {archived ? <RotateCcw aria-hidden="true" /> : <Archive aria-hidden="true" />}
              </Button>

              <Button
                variant="secondary"
                onClick={() => void draft.save()}
                disabled={
                  state.saveState === "saved" || state.saveState === "saving" || archived
                }
              >
                <Save aria-hidden="true" />
                Save draft
              </Button>

              <Button asChild variant="outline">
                <Link href={`/callbooks/${callbook.id}/preview`}>
                  <Eye aria-hidden="true" />
                  Preview
                </Link>
              </Button>

              <Button
                variant="secondary"
                onClick={() => setStartCallOpen(true)}
                disabled={!canStartCall}
                title={canStartCall ? undefined : "Publish this Callbook first"}
              >
                <Phone aria-hidden="true" />
                Start call
              </Button>

              <Button onClick={handlePublish} loading={publishing} disabled={archived}>
                <Rocket aria-hidden="true" />
                Publish
              </Button>
            </>
          }
        />
      </div>

      {contextSessionId ? (
        <div className="px-5 pt-3 md:px-8">
          <Alert tone="info" title="Opened from a saved session">
            Live calls started from here will show that session&apos;s frozen pricing.{" "}
            <Link
              href={`/dashboard/sessions/${contextSessionId}`}
              className="underline underline-offset-2"
            >
              Open the session
            </Link>
          </Alert>
        </div>
      ) : null}

      {leadId ? (
        <div className="px-5 pt-3 md:px-8">
          <Alert tone="info" title="Opened for a saved lead">
            Starting a call links it to that lead, and the lead&apos;s activity will show the call.{" "}
            <Link href={`/leads/${leadId}`} className="underline underline-offset-2">
              Open the lead
            </Link>
          </Alert>
        </div>
      ) : null}

      {state.saveError ? (
        <div className="px-5 pt-3 md:px-8">
          <Alert
            tone="danger"
            title="Something did not save"
            actions={
              <Button variant="outline" size="sm" onClick={() => void draft.save()}>
                Retry
              </Button>
            }
          >
            {state.saveError}
          </Alert>
        </div>
      ) : null}

      {state.notice ? (
        <div className="px-5 pt-3 md:px-8">
          <Alert
            tone="success"
            title={state.notice}
            actions={
              <button
                type="button"
                className="text-[11px] font-medium text-success underline"
                onClick={draft.clearNotice}
              >
                Dismiss
              </button>
            }
          />
        </div>
      ) : null}

      <MobileTabs value={mobileTab} onChange={setMobileTab} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[248px_minmax(0,1fr)_382px]">
        <div
          className={cn(
            "min-h-0 border-b border-border-subtle bg-surface/40 lg:block lg:border-b-0 lg:border-r",
            mobileTab === "steps" ? "block" : "hidden",
          )}
        >
          <BuilderTools
            graph={state.graph}
            validation={state.validation}
            selectedNodeId={state.selectedNodeId}
            onSelectNode={(nodeId) => {
              draft.selectNode(nodeId);
              setMobileTab("inspector");
            }}
            onMoveNode={(nodeId, direction) =>
              draft.apply((graph) => moveNode(graph, nodeId, direction))
            }
            onAddMessage={addMessage}
            onAddOutcome={addOutcome}
            onReviewChecks={() => setChecksOpen(true)}
          />
        </div>

        <div
          className={cn(
            "min-h-[60vh] min-w-0 border-b border-border-subtle lg:block lg:min-h-0 lg:border-b-0",
            mobileTab === "canvas" ? "block" : "hidden",
          )}
        >
          <GraphCanvas
            graph={state.graph}
            selectedNodeId={state.selectedNodeId}
            focusedBranchId={state.focusedBranchId}
            onSelectNode={(nodeId) => {
              draft.selectNode(nodeId);
              if (nodeId) setMobileTab("inspector");
            }}
            onFocusBranch={draft.focusBranch}
            onMoveNode={(nodeId, position) =>
              draft.apply((graph) => updateNode(graph, nodeId, { position }))
            }
            onConnectNodes={handleCanvasConnect}
          />
        </div>

        <div
          className={cn(
            "min-h-0 bg-surface/40 lg:block lg:border-l lg:border-border-subtle",
            mobileTab === "inspector" ? "block" : "hidden",
          )}
        >
          <NodeInspector
            graph={state.graph}
            nodeId={state.selectedNodeId}
            focusedBranchId={state.focusedBranchId}
            onFocusBranch={draft.focusBranch}
            onPatchNode={(patch) => {
              if (!selectedNodeId) return;
              draft.apply((graph) => updateNode(graph, selectedNodeId, patch));
            }}
            onMakeStart={() => {
              if (!selectedNodeId) return;
              draft.apply((graph) => setStartNode(graph, selectedNodeId));
            }}
            onDeleteNode={() => {
              if (!selectedNodeId) return;
              const removedId = selectedNodeId;
              draft.apply((graph) => deleteNode(graph, removedId).graph);
              draft.selectNode(null);
            }}
            onAddBranch={addResponse}
            onPatchBranch={(branchId, patch) => {
              if (!selectedNodeId) return;
              draft.apply((graph) => updateBranch(graph, selectedNodeId, branchId, patch));
            }}
            onDeleteBranch={(branchId) => {
              if (!selectedNodeId) return;
              draft.apply((graph) => removeBranch(graph, selectedNodeId, branchId));
            }}
            onMoveBranch={(branchId, direction) => {
              if (!selectedNodeId) return;
              draft.apply((graph) => moveBranch(graph, selectedNodeId, branchId, direction));
            }}
            onConnectBranch={(branchId, targetNodeId) => {
              if (!selectedNodeId) return { ok: false, error: "Select a step first." };
              const result = connectBranch(state.graph, selectedNodeId, branchId, targetNodeId);
              if (!result.ok) return { ok: false, error: result.error };
              draft.apply(() => result.graph);
              return { ok: true };
            }}
            onCreateNextStep={createNextStep}
          />
        </div>
      </div>

      <ChecksDialog
        open={checksOpen}
        onOpenChange={setChecksOpen}
        validation={state.validation}
        publishing={publishing}
        onGoToNode={(nodeId) => {
          draft.selectNode(nodeId);
          setChecksOpen(false);
          setMobileTab("inspector");
        }}
        onPublish={handlePublish}
      />

      <CallbookSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        meta={state.meta}
        markets={markets}
        onChange={draft.updateMeta}
      />

      {startCallOpen && state.hasPublishedSnapshot ? (
        <StartCallDialog
          callbookId={callbook.id}
          callbookTitle={state.meta.title}
          publishedVersion={state.publishedVersion}
          contextSessionId={contextSessionId}
          leadId={leadId}
          open
          onOpenChange={(open) => {
            if (!open) setStartCallOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function MobileTabs({ value, onChange }: { value: MobileTab; onChange: (tab: MobileTab) => void }) {
  const tabs: Array<{ id: MobileTab; label: string }> = [
    { id: "steps", label: "Steps" },
    { id: "canvas", label: "Canvas" },
    { id: "inspector", label: "Edit step" },
  ];

  return (
    <div
      className="flex gap-1 border-b border-border-subtle px-3 py-2 lg:hidden"
      role="tablist"
      aria-label="Builder panels"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-[8px] px-3 py-1.5 text-[12px] font-medium transition-colors",
            value === tab.id
              ? "bg-accent/15 text-foreground"
              : "text-secondary hover:bg-surface-elevated",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}