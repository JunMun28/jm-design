import type { ProjectRecord } from './projects.ts';
import { findArtifactByKind, resolveManifest } from './artifacts.ts';
import { collectExports, type ExportItem } from './exports.ts';

export interface FilesResponse {
  wireframe: { entry: string; slides: number } | null;
  decks: { id: string; theme: string; file: string; active: boolean; stale: boolean; slides: number }[];
  exports: ExportItem[];
}

/** Group a project's artifacts for the files panel: the wireframe, every deck
 *  variant (active + stale flags), and the downloadable exports. */
export async function buildFilesResponse(
  project: ProjectRecord,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FilesResponse> {
  const wfEntry = await findArtifactByKind(project.id, 'wireframe', env);
  const wfManifest = wfEntry ? await resolveManifest(project.id, wfEntry, env) : null;
  const decks = [];
  for (const v of project.decks) {
    let slides = 0;
    try { slides = (await resolveManifest(project.id, v.file, env)).slides; } catch { /* file may be missing */ }
    decks.push({
      id: v.id, theme: v.theme, file: v.file, slides,
      active: v.id === project.activeDeckId,
      stale: v.fromWireframeRev < project.wireframeRev,
    });
  }
  return {
    wireframe: wfManifest ? { entry: wfManifest.entry, slides: wfManifest.slides } : null,
    decks,
    exports: await collectExports(project, env),
  };
}
