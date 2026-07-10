import db from "./db";

export type ServiceType =
  | "pressure_washing"
  | "lawn_care"
  | "landscaping"
  | "led_lighting";

export type Job = {
  id: number;
  customer_name: string;
  phone: string | null;
  service_type: ServiceType;
  address: string | null;
  job_date: string | null;
  notes: string | null;
  review_text: string | null;
  created_at: string;
};

export type NewJob = {
  customer_name: string;
  phone?: string;
  service_type: ServiceType;
  address?: string;
  job_date?: string;
  notes?: string;
  review_text?: string;
};

export async function listJobs(): Promise<Job[]> {
  const { data, error } = await db
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Job[];
}

export async function getJob(id: number): Promise<Job | undefined> {
  const { data, error } = await db
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Job) ?? undefined;
}

export async function createJob(job: NewJob): Promise<Job> {
  const { data, error } = await db
    .from("jobs")
    .insert({
      customer_name: job.customer_name,
      phone: job.phone ?? null,
      service_type: job.service_type,
      address: job.address ?? null,
      job_date: job.job_date ?? null,
      notes: job.notes ?? null,
      review_text: job.review_text ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Job;
}
