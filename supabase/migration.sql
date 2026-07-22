-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)

create table if not exists jobs (
  id bigint generated always as identity primary key,
  customer_name text not null,
  phone text,
  service_type text not null,
  address text,
  job_date date,
  notes text,
  review_text text,
  created_at timestamptz not null default now()
);

create table if not exists job_photos (
  id bigint generated always as identity primary key,
  job_id bigint not null references jobs(id) on delete cascade,
  kind text not null check (kind in ('before', 'after')),
  file_path text not null,
  created_at timestamptz not null default now()
);

-- Storage bucket for uploaded job photos (public read, so <Image> can load them directly)
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

-- Allow the browser (anon key) to upload directly to the "scratch/" prefix,
-- bypassing our Vercel functions' request body size limit for the Media
-- generate/edit tools. Scoped to scratch/ only — job_photos before/after
-- uploads still go through the server (service role, which bypasses RLS).
drop policy if exists "Allow anon uploads to scratch prefix" on storage.objects;
create policy "Allow anon uploads to scratch prefix"
on storage.objects for insert
to anon
with check (
  bucket_id = 'job-photos'
  and (storage.foldername(name))[1] = 'scratch'
);
