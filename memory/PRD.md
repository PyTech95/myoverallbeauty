# Overall Beauty & Wellness (Spa USA) — PRD

## Original Problem Statement (this session)
User uploaded `spa-usa-main.zip` with a spa/wellness booking brief and said "build here". The zip turned out to be a **complete existing Emergent full-stack project** (Overall Beauty & Wellness), not a frontend template. Scope this session: restore it into `/app` and get it fully working.

## Architecture
- React 19 (CRA + craco) + Tailwind + shadcn/ui + framer-motion + lenis
- FastAPI + Motor/MongoDB, JWT Bearer auth (bcrypt)
- Routes: `/`, `/book`, `/signin`, `/signup`, `/account`, `/studio` (staff-only), legal pages

## User Personas
- Guest visitor — browses, submits consultation/contact
- Client — account, own booking history (`/account`)
- Staff/admin (Crystal) — `/studio`: content editor, calendar/blackouts, weekly hours, bookings inbox, messages inbox

## Core Requirements (static)
Public marketing site; multi-step booking with live availability; double-booking prevention; staff admin panel with page-content editing + schedule management; Editorial Noir design system (Cormorant Garamond + Manrope, cream/bronze on black).

## Implemented / Verified (2026-06)
- Restored all source into `/app`; installed backend + frontend deps
- Recreated missing env vars: `JWT_SECRET`, `STAFF_EMAIL`, `STAFF_PASSWORD`, `BUSINESS_EMAIL`, `EMAIL_FROM_NAME`
- Verified end-to-end by testing agent: 67/70 pytest passing (3 failures = email keys not configured), all frontend flows green, zero console errors
- Verified: staff login → Studio, content editor GET/PUT persist, calendar/blackouts, weekly hours, availability endpoint, booking flow, 409 double-booking, status changes/delete, contact form + inbox, client signup/login/`/consultations/mine`, role gating (403), image uploads
- Reset DB to a clean state (removed test seed data)

## Known Gaps
- **Email/SMS NOT configured** — booking + contact succeed but no confirmation emails are sent (needs Resend/SMTP keys)
- `GET /api/admin/stats` not implemented (not used by the frontend)
- `POST /api/consultations` accepts off-grid `preferred_time` strings

## Backlog
- P0 — Wire Resend email confirmations + reminders
- P1 — Stripe deposit/payment at booking; service catalog with pricing/duration
- P1 — Reschedule/cancel from client account; validate preferred_time against slot grid
- P2 — Twilio SMS reminders; multi-staff selection; CSV export; rate limiting on login

## Test Credentials
See `/app/memory/test_credentials.md` — staff: `crystal@overallbeauty.com` / `Overall2025!`
