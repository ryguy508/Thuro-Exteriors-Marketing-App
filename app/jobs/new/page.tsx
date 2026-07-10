"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SERVICE_TYPES = [
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "lawn_care", label: "Lawn Care" },
  { value: "landscaping", label: "Landscaping" },
  { value: "led_lighting", label: "LED Lighting" },
];

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const data = new FormData(form);

    const jobPayload = {
      customer_name: data.get("customer_name"),
      phone: data.get("phone") || undefined,
      service_type: data.get("service_type"),
      address: data.get("address") || undefined,
      job_date: data.get("job_date") || undefined,
      notes: data.get("notes") || undefined,
      review_text: data.get("review_text") || undefined,
    };

    try {
      const jobRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobPayload),
      });

      if (!jobRes.ok) {
        const body = await jobRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create job");
      }

      const job = await jobRes.json();

      const beforeFiles = (data.getAll("before_photos") as File[]).filter(
        (f) => f.size > 0
      );
      const afterFiles = (data.getAll("after_photos") as File[]).filter(
        (f) => f.size > 0
      );

      for (const file of beforeFiles) {
        await uploadPhoto(job.id, "before", file);
      }
      for (const file of afterFiles) {
        await uploadPhoto(job.id, "after", file);
      }

      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  async function uploadPhoto(jobId: number, kind: "before" | "after", file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const res = await fetch(`/api/jobs/${jobId}/photos`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to upload ${kind} photo`);
    }
  }

  return (
    <div className="page-shell">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-50">New Job</h1>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Field label="Customer name" required>
            <input
              name="customer_name"
              required
              className="input"
              placeholder="Jane Smith"
            />
          </Field>

          <Field label="Phone">
            <input name="phone" className="input" placeholder="(843) 555-0100" />
          </Field>

          <Field label="Service type" required>
            <select name="service_type" required className="input">
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Address / area">
            <input
              name="address"
              className="input"
              placeholder="123 Main St, Conway, SC"
            />
          </Field>

          <Field label="Job date">
            <input type="date" name="job_date" className="input" />
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              className="input min-h-24"
              placeholder="What was done, standout details worth mentioning in ad copy"
            />
          </Field>

          <Field label="Google review text (optional)">
            <textarea
              name="review_text"
              className="input min-h-20"
              placeholder="Paste the customer's review here if you have one"
            />
          </Field>

          <Field label="Before photos">
            <input
              type="file"
              name="before_photos"
              accept="image/*"
              multiple
              className="input"
            />
          </Field>

          <Field label="After photos">
            <input
              type="file"
              name="after_photos"
              accept="image/*"
              multiple
              className="input"
            />
          </Field>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-2"
          >
            {submitting ? "Saving..." : "Save job"}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      <span>
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}
