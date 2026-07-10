import { NextRequest, NextResponse } from "next/server";
import { createJob, listJobs, type NewJob } from "@/lib/jobs";

export async function GET() {
  return NextResponse.json(await listJobs());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as NewJob;

  if (!body.customer_name || !body.service_type) {
    return NextResponse.json(
      { error: "customer_name and service_type are required" },
      { status: 400 }
    );
  }

  const job = await createJob(body);
  return NextResponse.json(job, { status: 201 });
}
