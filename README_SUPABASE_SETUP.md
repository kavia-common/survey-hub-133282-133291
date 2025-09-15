# Supabase Setup and Troubleshooting Guide

This project uses Supabase (Postgres + Auth). If you see:
> "Could not find the table 'public.surveys' in the schema cache"

it typically means the database schema was not yet applied to your Supabase project, or the Supabase schema cache needs a refresh.

Follow these steps.

## 1) Apply the database schema

The full schema is in `database/schema.sql`.

Option A — Supabase SQL Editor:
1. Open Supabase Dashboard for your project.
2. SQL Editor → New query.
3. Paste the full contents of `database/schema.sql`.
4. Execute.

Option B — psql from your machine:
Make sure you have a direct Postgres connection string from Supabase (Project Settings → Database → Connection string).

Then run:
```
psql "<YOUR_SUPABASE_POSTGRES_CONNECTION_STRING>" -v ON_ERROR_STOP=1 -f database/schema.sql
```

Notes:
- The schema requires the `pgcrypto` extension for `gen_random_uuid()`. The SQL handles `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- Tables created: users, surveys, questions, options, responses, answers
- Enum type created (if missing): question_type_enum

## 2) Refresh Supabase schema cache (if needed)

Supabase usually refreshes automatically. If you continue getting the schema cache error:
- Visit Database → Table Editor → public schema, open any table; this often triggers cache refresh.
- Or run a benign DDL to force refresh (e.g. re-run an `CREATE INDEX IF NOT EXISTS ...` statement from the schema).
- Alternatively, use the 'Reset cache' button if available (UI can change).

## 3) Configure frontend environment

Create a `.env` in `survey_frontend`:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_KEY=your-anon-key
```

Restart the dev server after editing `.env`.

## 4) Verify from the frontend

Start the frontend:
```
cd survey-hub-133282-133291/survey_frontend
npm start
```

Open the Diagnostics page (link in the top navbar) or navigate to `/diagnostics`. You should see:
- Supabase URL and key presence
- A simple "can select from surveys" check
- Auth status

If the diagnostics shows `Table missing or not accessible`, go back to steps 1 and 2.

## Common pitfalls

- Missing RLS policies: This example assumes open access for simplicity during development. If you enable RLS, create policies to allow:
  - INSERT/SELECT for `surveys`, `questions`, `options`, `responses`, `answers`
  - INSERT for `users` when creating profiles
- Wrong environment variables: Ensure the URL is the Project URL from Supabase → Project settings → API, and the key is the "anon public" key.
- Browser caching: After changing `.env`, stop and restart `npm start`.

## Minimal policy examples (if you turn on RLS)
If you enable RLS, you'll need policies. For development-only, you might do:

```
-- Example: allow all read/write to authenticated users
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys_rw" ON public.surveys FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Repeat as needed for other tables...
```

Adjust to your security needs. For production, write least-privilege policies that align to your requirements.
