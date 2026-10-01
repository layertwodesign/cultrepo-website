import previewFrames from "./preview-frames.json";

type PreviewFrame = { poster: string; blur: string; start: number };

/** Cache is keyed by the video itself, never by film artwork. */
export function previewFrame(url: string | null | undefined): PreviewFrame | undefined {
  return url ? (previewFrames as Record<string, PreviewFrame>)[url] : undefined;
}
