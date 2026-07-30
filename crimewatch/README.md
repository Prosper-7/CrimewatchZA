# CrimeWatch ZA

A community incident-tracking console: live map, real-time incident feed, and a
reporting form, built as the web MVP for a broader crime-tracking platform for
South Africa.

## What's in this MVP

- **Live map** of reported incidents (Leaflet + OpenStreetMap, no map API key needed)
- **Report form** — title, description, category, severity, and location
  (GPS or typed address)
- **Real-time feed** — new reports appear on the map and in the log instantly
  for every connected user, powered by Supabase Realtime
- **Database schema** with row-level security: anyone can read reports,
  only signed-in users can submit, only moderators can verify/resolve

**Not included yet (by design, worth discussing with Brooklyn):**
- No live dispatch integration with SAPS — there's no public API for that.
  The form instead nudges users to call 10111/10177 for active emergencies,
  and reports are meant as a community + evidence log, not a 911-equivalent.
- No mobile/desktop wrapper yet — this is the web app first, per your call.
  Once it's solid, the same Supabase backend can power a React Native app
  or an Electron/Tauri desktop wrapper without changing the database.
- No push notifications yet (see "Next steps").

## Getting started

1. **Create a Supabase project** at https://supabase.com (free tier is fine to start).
2. In the Supabase dashboard, go to **SQL Editor** and run everything in
   `supabase/schema.sql`. This creates the `profiles` and `incidents` tables,
   security policies, and turns on realtime for incidents.
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key
   (Project Settings → API).
4. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the printed local URL. Since there's no login flow wired up in this
   first pass, incident inserts will go through as anonymous reports until
   auth is added (see below).

## Working with Brooklyn

Good natural split for two people:
- **You:** map/UI, incident feed, styling, mobile/desktop wrapper later
- **Brooklyn:** auth flow (Supabase Auth — email/OTP works well for SA phone
  numbers via WhatsApp/SMS OTP), moderation dashboard for verifying reports,
  and the true-crime content section (articles/case archive — a separate
  Supabase table, e.g. `articles`)

Push to a shared GitHub repo and each work off feature branches — happy to
help set that up too.

## Suggested next steps, roughly in order

1. **Auth** — Supabase Auth with email or phone OTP so reports aren't anonymous
2. **Photo/video evidence** — Supabase Storage bucket, attach media to a report
3. **Push/SMS alerts** — e.g. a Supabase Edge Function triggered on new
   high-severity incidents within a radius, fanning out via web push or
   an SMS provider (Twilio, Clickatell, or a local SA aggregator)
4. **Moderation queue** — a `/admin` view for moderators to verify or dismiss reports
5. **Geofenced "my area" view** — filter the map/feed to a saved home radius
6. **True-crime content section** — separate `articles` table + reader view
