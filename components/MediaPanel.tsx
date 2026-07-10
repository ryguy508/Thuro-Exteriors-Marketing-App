"use client";

import { useState } from "react";
import { resultLabel, resultVariant } from "./resultStatus";

type Source = "generate" | "upload";
type Mode = "image" | "video";
type EditKind = "edit-image" | "animate-image" | "edit-video";

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

  // upload-and-edit state
  const [editKind, setEditKind] = useState<EditKind>("edit-image");
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [outputKind, setOutputKind] = useState<Mode>("image");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setOutputKind(mode);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, prompt }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    setOutputKind(editKind === "edit-image" ? "image" : "video");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", editKind);
    formData.append("instructions", instructions);
    const res = await fetch("/api/edit", { method: "POST", body: formData });
    setResult(await res.json());
    setLoading(false);
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
                    setFile(null);
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <input
            type="file"
            accept={editKind === "edit-video" ? "video/*" : "image/*"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="input"
            required
          />

          <textarea
            className="input min-h-20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Brighten the driveway, remove clutter in the background"
            required
          />

          <button
            type="submit"
            disabled={loading || !file}
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
