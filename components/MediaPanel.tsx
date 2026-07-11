"use client";

import { useState } from "react";
import { resultLabel, resultVariant } from "./resultStatus";

type Source = "generate" | "upload";
type Mode = "image" | "video";
type EditKind = "edit-image" | "animate-image" | "edit-video";
type ContentType = "before_after" | "social_ad";

type MediaResult = {
  status: string;
  message: string;
  outputUrl?: string;
};

export default function MediaPanel() {
  const [source, setSource] = useState<Source>("generate");

  // generate-new state
  const [mode, setMode] = useState<Mode>("image");
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentType>("social_ad");

  // upload-and-edit state
  const [editKind, setEditKind] = useState<EditKind>("edit-image");
  const [files, setFiles] = useState<File[]>([]);
  const [instructions, setInstructions] = useState("");
  const [editContentType, setEditContentType] = useState<ContentType>("social_ad");

  const MAX_FILES = 5;
  const allowMultiple = editKind !== "edit-video";

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [outputKind, setOutputKind] = useState<Mode>("image");

  const POLL_INTERVAL_MS = 4000;
  const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes — Veo3 video can be slow

  async function pollUntilDone(taskId: string, mediaKind: Mode): Promise<MediaResult> {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const res = await fetch(
        `/api/media-status?taskId=${encodeURIComponent(taskId)}&mediaKind=${mediaKind}`
      );
      const data = await res.json();
      if (data.status !== "pending") return data;
      setResult({ status: "pending", message: pendingMessage(mediaKind) });
    }
    return {
      status: "provider_error",
      message:
        "Still generating after 10 minutes — kie.ai may finish it in the background. Check your kie.ai dashboard, or try again.",
    };
  }

  function pendingMessage(mediaKind: Mode): string {
    return mediaKind === "video"
      ? "Generating video — this can take a few minutes..."
      : "Generating image...";
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setOutputKind(mode);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, prompt, contentType }),
    });
    const data = await res.json();
    if (data.status === "pending" && data.taskId) {
      setResult({ status: "pending", message: pendingMessage(data.mediaKind ?? mode) });
      setResult(await pollUntilDone(data.taskId, data.mediaKind ?? mode));
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setLoading(true);
    setResult(null);
    const kindGuess: Mode = editKind === "edit-image" ? "image" : "video";
    setOutputKind(kindGuess);
    const formData = new FormData();
    for (const f of files) formData.append("file", f);
    formData.append("kind", editKind);
    formData.append("instructions", instructions);
    formData.append("contentType", editContentType);
    const res = await fetch("/api/edit", { method: "POST", body: formData });
    const data = await res.json();
    if (data.status === "pending" && data.taskId) {
      const mediaKind: Mode = data.mediaKind ?? kindGuess;
      setOutputKind(mediaKind);
      setResult({ status: "pending", message: pendingMessage(mediaKind) });
      setResult(await pollUntilDone(data.taskId, mediaKind));
    } else {
      setResult(data);
    }
    setLoading(false);
  }

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setFiles((prev) => {
      const combined = allowMultiple ? [...prev, ...Array.from(newFiles)] : Array.from(newFiles).slice(0, 1);
      return combined.slice(0, MAX_FILES);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Media</h2>

      <div className="mt-3 flex gap-2">
        {(
          [
            { value: "generate", label: "Generate new" },
            { value: "upload", label: "Upload & edit" },
          ] as { value: Source; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            data-active={source === opt.value}
            onClick={() => {
              setSource(opt.value);
              setResult(null);
            }}
            className="btn-toggle"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {source === "generate" ? (
        <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {(["image", "video"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                data-active={mode === m}
                onClick={() => setMode(m)}
                className="btn-toggle"
              >
                {m === "image" ? "Image" : "Video"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {(
              [
                { value: "social_ad", label: "Social ad" },
                { value: "before_after", label: "Before/after" },
              ] as { value: ContentType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-active={contentType === opt.value}
                onClick={() => setContentType(opt.value)}
                className="btn-toggle"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <textarea
            className="input min-h-24"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === "image"
                ? "e.g. Freshly pressure-washed brick driveway, photorealistic, warm light"
                : "e.g. Slow cinematic pan across a glowing LED-lit house at dusk"
            }
            required
          />

          <button
            type="submit"
            disabled={loading || !prompt}
            className="btn-primary self-start"
          >
            {loading ? "Generating..." : `Generate ${mode}`}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEdit} className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            {(
              [
                { value: "social_ad", label: "Social ad" },
                { value: "before_after", label: "Before/after" },
              ] as { value: ContentType; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-active={editContentType === opt.value}
                onClick={() => setEditContentType(opt.value)}
                className="btn-toggle"
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {(
              [
                { value: "edit-image", label: "Edit a photo", accept: "image/*" },
                {
                  value: "animate-image",
                  label: "Animate a photo into video",
                  accept: "image/*",
                },
                { value: "edit-video", label: "Edit a video", accept: "video/*" },
              ] as { value: EditKind; label: string; accept: string }[]
            ).map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <input
                  type="radio"
                  name="editKind"
                  checked={editKind === opt.value}
                  onChange={() => {
                    setEditKind(opt.value);
                    setFiles([]);
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <input
            type="file"
            accept={editKind === "edit-video" ? "video/*" : "image/*"}
            multiple={allowMultiple}
            onChange={(e) => addFiles(e.target.files)}
            className="input"
            required={files.length === 0}
          />
          {allowMultiple && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Up to {MAX_FILES} reference photos — select several at once, or add more with another click.
            </p>
          )}

          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                >
                  <span className="max-w-40 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100"
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <textarea
            className="input min-h-20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Brighten the driveway, remove clutter in the background"
            required
          />

          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="btn-primary self-start"
          >
            {loading ? "Processing..." : "Run edit"}
          </button>
        </form>
      )}

      {result && (
        <div className="result-box" data-variant={resultVariant(result.status)}>
          <p className="result-label">{resultLabel(result.status)}</p>
          <p className="mt-1 text-zinc-800 dark:text-zinc-200">{result.message}</p>
          {result.outputUrl &&
            (outputKind === "video" ? (
              <video
                src={result.outputUrl}
                controls
                className="mt-3 max-h-96 w-full rounded-md"
              />
            ) : (
              <img
                src={result.outputUrl}
                alt="Generated result"
                className="mt-3 max-h-96 w-full rounded-md object-contain"
              />
            ))}
        </div>
      )}
    </div>
  );
}
