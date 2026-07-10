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
