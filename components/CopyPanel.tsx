"use client";

import { useState } from "react";
import { resultLabel, resultVariant } from "./resultStatus";

const SERVICE_TYPES = [
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "lawn_care", label: "Lawn Care" },
  { value: "landscaping", label: "Landscaping" },
  { value: "led_lighting", label: "LED Lighting" },
];

type CopyResult = {
  status: string;
  message: string;
};

export default function CopyPanel({
  platform,
}: {
  platform: "meta_ad" | "social_post";
}) {
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0].value);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyResult | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/ad-copy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceType, platform, details }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div className="card">
      <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Copy</h2>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Service type
          <select
            className="input"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Job details
          <textarea
            className="input min-h-24"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              platform === "meta_ad"
                ? "e.g. Driveway had years of algae buildup, dramatic before/after, target Conway homeowners"
                : "e.g. Quick behind-the-scenes caption showing today's LED install job"
            }
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || !details}
          className="btn-primary self-start"
        >
          {loading ? "Generating..." : "Generate copy"}
        </button>
      </form>

      {result && (
        <div className="result-box" data-variant={resultVariant(result.status)}>
          <p className="result-label">{resultLabel(result.status)}</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
            {result.message}
          </p>
        </div>
      )}
    </div>
  );
}
