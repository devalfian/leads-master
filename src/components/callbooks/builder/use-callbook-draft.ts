"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch, apiPost, apiPut } from "@/lib/api/client";
import { canonicalizeGraph, validateGraph } from "@/lib/callbooks/graph";
import type { ValidationResult } from "@/lib/callbooks/graph";
import type {
  Callbook,
  CallbookGoal,
  CallbookGraph,
  CallbookLanguage,
  CallbookStatus,
} from "@/lib/callbooks/types";

export type CallbookMetaState = {
  title: string;
  description: string;
  targetAudience: string;
  primaryGoal: CallbookGoal;
  marketId: string | null;
  nicheCategoryId: string | null;
  language: CallbookLanguage | null;
  internalNotes: string;
};

export type SaveState = "saved" | "dirty" | "saving" | "error";

export type BuilderState = {
  graph: CallbookGraph;
  meta: CallbookMetaState;
  status: CallbookStatus;
  publishedVersion: number;
  publishedAt: string | null;
  hasPublishedSnapshot: boolean;
  hasUnpublishedChanges: boolean;
  selectedNodeId: string | null;
  focusedBranchId: string | null;
  saveState: SaveState;
  saveError: string | null;
  lastSavedAt: string | null;
  validation: ValidationResult;
  notice: string | null;
};

function metaOf(callbook: Callbook): CallbookMetaState {
  return {
    title: callbook.title,
    description: callbook.description,
    targetAudience: callbook.targetAudience,
    primaryGoal: callbook.primaryGoal,
    marketId: callbook.marketId,
    nicheCategoryId: callbook.nicheCategoryId,
    language: callbook.language,
    internalNotes: callbook.internalNotes,
  };
}

function metaSignature(meta: CallbookMetaState): string {
  return JSON.stringify({
    title: meta.title.trim(),
    description: meta.description.trim(),
    targetAudience: meta.targetAudience.trim(),
    primaryGoal: meta.primaryGoal,
    marketId: meta.marketId,
    nicheCategoryId: meta.nicheCategoryId,
    language: meta.language,
    internalNotes: meta.internalNotes,
  });
}

/**
 * Owns the unsaved builder draft and the save/publish lifecycle.
 * The draft lives in client state only; nothing is reported as saved until the
 * server confirms it.
 */
export function useCallbookDraft(callbook: Callbook) {
  const router = useRouter();

  const [graph, setGraph] = useState<CallbookGraph>(callbook.graph);
  const [meta, setMeta] = useState<CallbookMetaState>(metaOf(callbook));
  const [savedGraphSignature, setSavedGraphSignature] = useState(() =>
    canonicalizeGraph(callbook.graph),
  );
  const [savedMetaSignature, setSavedMetaSignature] = useState(() =>
    metaSignature(metaOf(callbook)),
  );

  const [status, setStatus] = useState<CallbookStatus>(callbook.status);
  const [publishedVersion, setPublishedVersion] = useState(callbook.publishedVersion);
  const [publishedAt, setPublishedAt] = useState(callbook.publishedAt);
  const [hasPublishedSnapshot, setHasPublishedSnapshot] = useState(callbook.hasPublishedSnapshot);
  const [serverUnpublished, setServerUnpublished] = useState(callbook.hasUnpublishedChanges);
  const [localEdits, setLocalEdits] = useState(false);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    callbook.graph.startNodeId ?? callbook.graph.nodes[0]?.id ?? null,
  );
  const [focusedBranchId, setFocusedBranchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(callbook.updatedAt);
  const [notice, setNotice] = useState<string | null>(null);

  /** Guards against double-submits of Save / Publish. */
  const inFlight = useRef(false);

  const graphSignature = canonicalizeGraph(graph);
  const metaSignatureValue = metaSignature(meta);
  const dirty = graphSignature !== savedGraphSignature || metaSignatureValue !== savedMetaSignature;
  const hasUnpublishedChanges = localEdits || serverUnpublished;
  const validation = useMemo(() => validateGraph(graph), [graph]);

  /** Applies a pure graph mutation and marks the draft as edited. */
  const apply = useCallback((updater: (current: CallbookGraph) => CallbookGraph) => {
    setGraph((current) => updater(current));
    setLocalEdits(true);
    setSaveError(null);
    setNotice(null);
  }, []);

  const updateMeta = useCallback((patch: Partial<CallbookMetaState>) => {
    setMeta((current) => ({ ...current, ...patch }));
    setLocalEdits(true);
    setSaveError(null);
    setNotice(null);
  }, []);

  const save = useCallback(async (): Promise<{ ok: boolean; callbook: Callbook | null }> => {
    if (inFlight.current) return { ok: false, callbook: null };
    if (!dirty) {
      setLocalEdits(false);
      return { ok: true, callbook: null };
    }

    inFlight.current = true;
    setSaving(true);
    setSaveError(null);

    try {
      let latest: Callbook | null = null;

      if (metaSignatureValue !== savedMetaSignature) {
        const response = await apiPatch<{ callbook: Callbook }>(`/api/callbooks/${callbook.id}`, {
          title: meta.title.trim(),
          description: meta.description,
          targetAudience: meta.targetAudience,
          primaryGoal: meta.primaryGoal,
          marketId: meta.marketId,
          nicheCategoryId: meta.nicheCategoryId,
          language: meta.language,
          internalNotes: meta.internalNotes,
        });
        if (!response.ok) {
          setSaveError(response.error.message);
          return { ok: false, callbook: null };
        }
        latest = response.data.callbook;
        setSavedMetaSignature(metaSignatureValue);
      }

      if (graphSignature !== savedGraphSignature) {
        const response = await apiPut<{ callbook: Callbook }>(
          `/api/callbooks/${callbook.id}/graph`,
          { graph },
        );
        if (!response.ok) {
          setSaveError(response.error.message);
          return { ok: false, callbook: null };
        }
        latest = response.data.callbook;
        setGraph(response.data.callbook.graph);
        setSavedGraphSignature(canonicalizeGraph(response.data.callbook.graph));
      }

      if (latest) {
        const saved = latest;
        setLocalEdits(false);
        setServerUnpublished(saved.hasUnpublishedChanges);
        setStatus(saved.status);
        setLastSavedAt(new Date().toISOString());
        setNotice("Draft saved.");
        setSelectedNodeId((previous) =>
          previous && saved.graph.nodes.some((node) => node.id === previous) ? previous : null,
        );
      }

      return { ok: true, callbook: latest };
    } catch {
      setSaveError("The draft could not be saved. Your changes are still here — try again.");
      return { ok: false, callbook: null };
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [
    callbook.id,
    dirty,
    graph,
    graphSignature,
    meta,
    metaSignatureValue,
    savedGraphSignature,
    savedMetaSignature,
  ]);

  const publish = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false;

    if (!validateGraph(graph).ok) {
      setSaveError("Fix the checks before publishing. Nothing was published.");
      return false;
    }

    const saved = await save();
    if (!saved.ok) return false;

    setSaving(true);
    inFlight.current = true;
    try {
      const response = await apiPost<{
        callbook: Callbook;
        version: number;
        publishedAt: string;
      }>(`/api/callbooks/${callbook.id}/publish`);

      if (!response.ok) {
        setSaveError(response.error.message);
        return false;
      }

      setStatus("published");
      setPublishedVersion(response.data.version);
      setPublishedAt(response.data.publishedAt);
      setHasPublishedSnapshot(true);
      setServerUnpublished(false);
      setLocalEdits(false);
      setNotice(`Published version ${response.data.version}. New calls will use it.`);
      router.refresh();
      return true;
    } catch {
      setSaveError("Publishing failed. Your draft is unchanged — try again.");
      return false;
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [callbook.id, graph, router, save]);

  const toggleArchive = useCallback(async (): Promise<boolean> => {
    const archived = status !== "archived";
    const response = await apiPost<{ callbook: Callbook }>(
      `/api/callbooks/${callbook.id}/archive`,
      { archived },
    );
    if (!response.ok) {
      setSaveError(response.error.message);
      return false;
    }
    setStatus(response.data.callbook.status);
    setNotice(archived ? "Callbook archived." : "Callbook restored.");
    router.refresh();
    return true;
  }, [callbook.id, router, status]);

  const state: BuilderState = {
    graph,
    meta,
    status,
    publishedVersion,
    publishedAt,
    hasPublishedSnapshot,
    hasUnpublishedChanges,
    selectedNodeId,
    focusedBranchId,
    saveState: saving ? "saving" : saveError ? "error" : dirty ? "dirty" : "saved",
    saveError,
    lastSavedAt,
    validation,
    notice,
  };

  return {
    state,
    apply,
    updateMeta,
    save,
    publish,
    toggleArchive,
    selectNode: setSelectedNodeId,
    focusBranch: setFocusedBranchId,
    clearNotice: () => setNotice(null),
  };
}

export type CallbookDraftController = ReturnType<typeof useCallbookDraft>;