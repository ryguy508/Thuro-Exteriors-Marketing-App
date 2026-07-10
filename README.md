# Thuro Exteriors Marketing App

AI media studio and ad-copy generator for Thuro Exteriors — a home services
business (pressure washing, lawn care, landscaping, permanent/holiday LED
lighting) in Conway, SC. One app to generate/edit images and video, write
Meta ad scripts and social captions, and keep it all organized by customer.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.local` (not committed) with:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Database tables and the photo storage bucket are created by running
`supabase/migration.sql` once in the Supabase SQL Editor.

## Deploy

Deployed on [Vercel](https://vercel.com). Push to `main` to trigger a
deploy once the GitHub integration is connected.
