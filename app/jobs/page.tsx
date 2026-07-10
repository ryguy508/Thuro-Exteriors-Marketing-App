import Link from "next/link";
import { listJobs } from "@/lib/jobs";

export const dynamic = "force-dynamic";

const SERVICE_LABELS: Record<string, string> = {
  pressure_washing: "Pressure Washing",
  lawn_care: "Lawn Care",
  landscaping: "Landscaping",
  led_lighting: "LED Lighting",
};

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <div className="page-shell">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-50">Customers</h1>
          <Link href="/jobs/new" className="btn-primary">
            + New job
          </Link>
        </div>

        {jobs.length === 0 ? (
          <p className="mt-8 text-zinc-400">
            No jobs yet. Click &ldquo;New job&rdquo; to add your first one.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-zinc-800">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block rounded-md px-3 py-4 hover:bg-zinc-900"
                >
                  <p className="font-medium text-zinc-50">
                    {job.customer_name} —{" "}
                    {SERVICE_LABELS[job.service_type] || job.service_type}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {job.address || "No address"} · {job.job_date || "No date"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
