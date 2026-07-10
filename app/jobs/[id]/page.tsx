import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { listPhotosForJob } from "@/lib/photos";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
  pressure_washing: "Pressure Washing",
  lawn_care: "Lawn Care",
  landscaping: "Landscaping",
  led_lighting: "LED Lighting",
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(Number(id));

  if (!job) {
    notFound();
  }

  const photos = await listPhotosForJob(job.id);
  const beforePhotos = photos.filter((p) => p.kind === "before");
  const afterPhotos = photos.filter((p) => p.kind === "after");

  return (
    <div className="page-shell">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/jobs"
          className="text-sm text-zinc-500 hover:text-[var(--accent)] hover:underline"
        >
          ← Back to customers
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-zinc-50">
          {job.customer_name}
        </h1>
        <p className="text-zinc-400">
          {SERVICE_LABELS[job.service_type] || job.service_type}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <Detail label="Phone" value={job.phone} />
          <Detail label="Address" value={job.address} />
          <Detail label="Job date" value={job.job_date} />
          <Detail label="Created" value={job.created_at} />
        </dl>

        {job.notes && (
          <Section title="Notes">
            <p className="whitespace-pre-wrap text-zinc-300">{job.notes}</p>
          </Section>
        )}

        {job.review_text && (
          <Section title="Google review">
            <p className="whitespace-pre-wrap text-zinc-300">
              {job.review_text}
            </p>
          </Section>
        )}

        <Section title={`Before photos (${beforePhotos.length})`}>
          <PhotoGrid photos={beforePhotos} />
        </Section>

        <Section title={`After photos (${afterPhotos.length})`}>
          <PhotoGrid photos={afterPhotos} />
        </Section>

        <Section title="Generated content">
          <p className="text-zinc-500">
            Ad scripts, testimonial videos, and cinematic videos generated for
            this job will show up here once those pieces are built.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-50">{value || "—"}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 border-t border-zinc-800 pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PhotoGrid({
  photos,
}: {
  photos: { id: number; file_path: string }[];
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-zinc-500">No photos uploaded.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square overflow-hidden rounded-md border border-zinc-800"
        >
          <Image src={photo.file_path} alt="" fill className="object-cover" />
        </div>
      ))}
    </div>
  );
}
