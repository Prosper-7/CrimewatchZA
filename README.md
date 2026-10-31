# CrimeWatch ZA

A community crime-tracking and incident-reporting platform for South Africa — a live map, real-time reports, and a true-crime content section, built to run as a web app, mobile app, and desktop app from one shared backend.

## Why we built this

Most "staying informed about crime nearby" in South Africa happens informally — a neighbourhood WhatsApp group, a security company's own closed system, word of mouth. There's no single, open place where citizens, community organizations, private security, and law enforcement can see and share verified incident information in real time. CrimeWatch ZA is that place: start with the web app, prove out the map and reporting experience, then extend the same backend to mobile and desktop.

**Important scope note:** this is a community reporting and evidence log, not a live emergency dispatch system — there's no API wiring reports directly into SAPS dispatch. The app makes clear that anyone in active danger should call SAPS (10111) or ambulance services (10177) directly, not rely on a report here. Because the platform stores personal information and precise location data, it also falls under South Africa's POPIA — consent wording, data retention, and what happens to a reporter's identity if shared with authorities all need a legal read-through before public launch.

## Who it's for

- Residents who want a clear, real-time picture of incidents near them
- Community organizations and neighbourhood watches coordinating on verified information instead of rumour
- Private security companies needing a shared view of activity across their coverage areas
- Law enforcement agencies looking for a community-sourced layer alongside official reporting

## The team

**Prosper Odoemela** — Map & incident UI, report form & UX, mobile/desktop wrapper (once web is stable) · prosperodoemela4@gmail.com · github.com/Prosper-7
**Brooklyn Chigozie** — Auth & accounts, moderation dashboard, true-crime content section
**Shared** — alert rules & the phase-3 notification system (Prosper: push/UI, Brooklyn: Edge Function trigger), database schema and infra decisions

## What it does

- **Live incident map & feed** — Leaflet + OpenStreetMap (no paid map API key needed), with new reports appearing instantly via Supabase Realtime
- **Incident reporting** — title, description, category, severity, location (GPS or address), and up to 3 photo/video attachments as evidence
- **Phone authentication** — sign in via OTP to a South African phone number
- **Moderation dashboard** — moderators/admins verify, resolve, or dismiss reports (role-gated)
- **True-crime content section** — longer-form articles/case archive, with a moderator-only editor
- **Area alerts** *(in progress)* — residents set a watch area on the map and opt in to push/SMS notification for nearby incidents

## Tech stack

| Layer | Technology | Owner |
|---|---|---|
| Frontend (web) | React, TypeScript, Vite | Prosper |
| Mapping | Leaflet / React-Leaflet, OpenStreetMap tiles | Prosper |
| Backend & data | Supabase (Postgres + RLS, Auth, Realtime, Storage) | Shared |
| Alerts backend (Edge Function, push, SMS) | Supabase Edge Functions | Brooklyn |
| Moderation & content | React | Brooklyn |
| Mobile / desktop (planned) | React Native or Capacitor; Electron or Tauri | Prosper |

## Project structure
CrimewatchZA/
├── crimewatch/
│   ├── src/
│   │   ├── components/   map, feed, report form, header, auth
│   │   ├── pages/        moderation dashboard, articles, alert settings
│   │   ├── hooks/        incident data + realtime subscription
│   │   ├── context/      auth context
│   │   └── lib/          supabase client, web push helpers
│   ├── public/           service worker (sw.js)
│   └── supabase/
│       └── schema.sql    tables, RLS policies, storage bucket
