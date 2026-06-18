import { Injectable } from '@angular/core';
import type {
  Anchor,
  AnnotationSurface,
  ArtifactManifest,
  DetectedAgent,
  ExportItem,
  FilesResponse,
  LoadedProject,
  OnboardingPlan,
  OutputFormat,
  ProjectRecord,
  QueuedFeedback,
  StageAttachmentsResult,
  StagedAttachment,
  ThemeCard,
} from './types';

/** Thin HTTP client for the daemon command surface. Uses fetch to avoid an
 *  HttpClient provider for the skeleton; the daemon serves us same-origin. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  async listAgents(): Promise<DetectedAgent[]> {
    const res = await fetch('/api/agents');
    if (!res.ok) return [];
    return (await res.json()).agents ?? [];
  }

  /** First-run onboarding plan (Slice 10): detect runtimes + auth, return the
   *  plain-language install→sign-in steps the wizard renders. */
  async getOnboarding(): Promise<OnboardingPlan | null> {
    const res = await fetch('/api/onboarding');
    if (!res.ok) return null;
    return (await res.json()).plan ?? null;
  }

  async listProjects(): Promise<ProjectRecord[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) return [];
    return (await res.json()).projects ?? [];
  }

  async createProject(brief: string, runtimeId: string | null): Promise<ProjectRecord> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brief, runtimeId }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return (await res.json()).project;
  }

  async getProject(id: string): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  /** Resume a past Project into its prior state (Slice 11): record + the full
   *  conversation transcript, so the workspace can restore every prior turn. */
  async loadProject(id: string): Promise<LoadedProject | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/load`);
    if (!res.ok) return null;
    return (await res.json()) as LoadedProject;
  }

  /** Brief-panel intake: mark the agent-generated questionnaire answered. Called
   *  AFTER the compiled answer message is sent through the chat; the Brief panel
   *  then reverts to the normal recorded-discussion display. */
  async markQuestionnaireAnswered(id: string): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/questionnaire/answered`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  /** Gate 1: approve the arc (advances the flow) or request changes (loops). */
  async setGate1(id: string, action: 'approve' | 'request-changes'): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/gate1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  // --- Feedback queue (Slice 13, AC2) — survives an interrupted run ---------

  /** The pending feedback the daemon persisted (rehydrates the composer pills). */
  async listFeedback(id: string): Promise<QueuedFeedback[]> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/feedback`);
    if (!res.ok) return [];
    return (await res.json()).pending ?? [];
  }

  /** Queue one piece of feedback durably; returns the new pending list. */
  async queueFeedback(
    id: string,
    item: {
      kind: 'comment' | 'annotation';
      text: string;
      selector?: string;
      anchorText?: string;
      slideIndex?: number;
      surface?: AnnotationSurface;
      anchor?: Anchor | null;
      screenshot?: string;
    },
  ): Promise<QueuedFeedback[]> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!res.ok) return this.listFeedback(id);
    return (await res.json()).pending ?? [];
  }

  /** Remove ONE queued item (the × on a single pill); returns the new pending list. */
  async removeFeedbackItem(id: string, itemId: string): Promise<QueuedFeedback[]> {
    const res = await fetch(
      `/api/projects/${encodeURIComponent(id)}/feedback/${encodeURIComponent(itemId)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) return this.listFeedback(id);
    return (await res.json()).pending ?? [];
  }

  /** Discard the pending feedback queue. */
  async clearFeedback(id: string): Promise<void> {
    await fetch(`/api/projects/${encodeURIComponent(id)}/feedback`, { method: 'DELETE' });
  }

  // --- Source-material attachments (Slice 8, issue #9, §9.5) ---------------

  /**
   * Stage source files (xlsx/csv/pptx/pdf/images) into the Project so the agent
   * reads them and cites REAL figures (AC1). Files are sent base64 on the JSON
   * body the loopback daemon expects (`{ files: [{ filename, data }] }`). The
   * daemon classifies + size-caps each one and returns `staged` plus `skipped`
   * notes for anything unsupported / oversized — which the caller surfaces to the
   * user WITHOUT blocking the flow (AC2). Never throws: a transport failure maps
   * every file to a friendly "couldn't upload" skip so the composer keeps moving.
   */
  async uploadAttachments(id: string, files: File[]): Promise<StageAttachmentsResult> {
    const list = [...files];
    if (!list.length) return { staged: [], skipped: [] };
    try {
      const payload = await Promise.all(
        list.map(async (f) => ({ filename: f.name, data: await fileToBase64(f) })),
      );
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}/attachments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ files: payload }),
      });
      if (!res.ok) throw new Error(`attachments upload failed (${res.status})`);
      const body = (await res.json()) as Partial<StageAttachmentsResult>;
      return { staged: body.staged ?? [], skipped: body.skipped ?? [] };
    } catch {
      // Never block the run on a transport hiccup (AC2): report a friendly skip.
      return {
        staged: [],
        skipped: list.map((f) => ({
          filename: f.name,
          reason: 'unreadable' as const,
          note: `"${f.name}" couldn't be uploaded, so it was left out. The deck will be built from everything else.`,
        })),
      };
    }
  }

  /** The source files already staged for a Project (rehydrates the composer chips
   *  on workspace load / resume). */
  async listAttachments(id: string): Promise<StagedAttachment[]> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/attachments`);
    if (!res.ok) return [];
    return (await res.json()).staged ?? [];
  }

  /** The served URL for one staged source file's bytes (file browser preview +
   *  download). `relPath` is the attachment's project-relative path (e.g.
   *  `attachments/yield-q3.csv`); the daemon serves it inline, path-safe. */
  attachmentContentUrl(id: string, relPath: string): string {
    return `/api/projects/${encodeURIComponent(id)}/attachment/content?entry=${encodeURIComponent(relPath)}`;
  }

  // --- Artifacts (Slice 3, issue #8) — wireframe canvas surface ------------

  /** The current Artifact Manifest, used on load to pick the canvas surface
   *  (kind = 'wireframe' → sandboxed iframe). null when nothing produced yet. */
  async getArtifact(id: string): Promise<ArtifactManifest | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/artifact`);
    if (!res.ok) return null;
    return (await res.json()).manifest ?? null;
  }

  /** Fetch an artifact entry's HTML so the iframe can load it via `srcdoc` —
   *  keeping the sandbox cross-origin (no allow-same-origin). */
  async getArtifactContent(id: string, entry: string): Promise<string | null> {
    const res = await fetch(
      `/api/projects/${encodeURIComponent(id)}/artifact/content?entry=${encodeURIComponent(entry)}`,
    );
    if (!res.ok) return null;
    return res.text();
  }

  /** The Annotation SDK source (Slice 4, issue #11), injected into the sandboxed
   *  Wireframe AND Deck iframes (Slice 12 / issue #15) so the user can pin element
   *  / text / per-slide annotations. Fetched from the daemon (single source of
   *  truth) and cached for the session. */
  private sdkSource: string | null = null;
  async getAnnotationSdk(): Promise<string> {
    if (this.sdkSource != null) return this.sdkSource;
    try {
      const res = await fetch('/api/annotation-sdk.js');
      this.sdkSource = res.ok ? await res.text() : '';
    } catch {
      this.sdkSource = '';
    }
    return this.sdkSource;
  }

  // --- Gate 2 (Slice 4, issue #11) — wireframe approval --------------------

  /** Gate 2: approve the wireframe (advances Wireframe → Theme) or request changes
   *  (holds on Wireframe so the user keeps annotating). */
  async setGate2(id: string, action: 'approve' | 'request-changes'): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/gate2`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  // --- Themes + Gate 3 (Slice 5, issue #12) --------------------------------

  /** The `html-slides` theme catalogue for the picker (Gate 3, §11). Read live
   *  from the daemon so a new upstream theme appears without a code change. */
  async listThemes(): Promise<ThemeCard[]> {
    const res = await fetch('/api/themes');
    if (!res.ok) return [];
    return (await res.json()).themes ?? [];
  }

  /** The served thumbnail URL for a theme's preview (Gate 3, AC1). */
  themeThumbnailUrl(id: string): string {
    return `/api/themes/${encodeURIComponent(id)}/thumbnail`;
  }

  /** Gate 3: persist the picked theme (and format(s)), advancing Theme → Deck so
   *  the themed Deck is generated. The selection persists on the Project (AC1). */
  async setTheme(
    id: string,
    theme: string,
    formats?: OutputFormat[],
  ): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/theme`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme, formats }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  // --- Export panel (Slice 7, issue #14, M6) -------------------------------

  /** The produced, downloadable output(s) for a Project (§12): only files that
   *  actually exist, each with its Brief-derived save filename + size. The socket
   *  pushes an `exports` frame after generation; this read backs load/resume. */
  async listExports(id: string): Promise<ExportItem[]> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/exports`);
    if (!res.ok) return [];
    return (await res.json()).items ?? [];
  }

  /** The download URL for one produced output. The daemon sets a
   *  Content-Disposition so the browser saves the Brief-derived filename. */
  exportDownloadUrl(id: string, entry: string): string {
    return `/api/projects/${encodeURIComponent(id)}/export/download?entry=${encodeURIComponent(entry)}`;
  }

  // --- Files panel + variant switcher (S3) ---------------------------------

  /** The files-panel grouping for a Project: the wireframe, every deck variant
   *  (active/stale flags), and the downloadable exports. null on a transport /
   *  not-found failure so the panel renders empty rather than blowing up. */
  async listFiles(id: string): Promise<FilesResponse | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/files`);
    if (!res.ok) return null;
    return (await res.json()).files;
  }

  /** Make an existing deck variant active (the variant switcher). The active-aware
   *  artifact route then serves this variant; returns the updated record, or null
   *  if the project / variant id is unknown. */
  async setActiveDeck(id: string, deckId: string): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}/active-deck`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ deckId }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  // --- Library card actions: rename + delete -------------------------------

  /** Rename a Project (the library card's title); returns the updated record, or
   *  null if the project is unknown / the title was rejected. */
  async renameProject(id: string, title: string): Promise<ProjectRecord | null> {
    const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return null;
    return (await res.json()).project;
  }

  /** Delete a Project (and its whole directory). Resolves once the daemon has
   *  removed it; a missing project is a no-op from the caller's view. */
  async deleteProject(id: string): Promise<void> {
    await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

/** Read a browser File into base64 (no data-URL prefix) — the shape the daemon's
 *  attachments route decodes with `Buffer.from(data, 'base64')`. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      // FileReader yields a `data:<mime>;base64,<payload>` URL — strip the prefix.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}
