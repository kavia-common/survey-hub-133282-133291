# Survey Frontend (React + Tailwind + Supabase)

A web UI for creating, participating in, and analyzing surveys. Uses Supabase for auth and database.

## Environment variables
Create a `.env` file in this folder with:
```
REACT_APP_SUPABASE_URL=your-url
REACT_APP_SUPABASE_KEY=your-anon-key
```
See `.env.example` for the format.

## Scripts
- `npm start` and open http://localhost:3000
- `npm run build` to build for production

## Features
- Authentication (email/password) with profile creation in `users` table
- Survey creation with questions and options persisted to Supabase
- Survey participation (responses + answers)
- Results visualization with simple analytics

## Notes
- Ensure your Supabase SQL schema matches `../database/schema.sql`.
- Make sure pgcrypto extension is enabled in your database for UUIDs.
- For email confirmations, configure SITE URL in Supabase settings appropriately.

## SQL schema
See `../database/schema.sql` for the PostgreSQL DDL with UUIDs using `gen_random_uuid()` and FK constraints.
