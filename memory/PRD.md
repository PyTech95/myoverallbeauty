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

## Implemented (2026-06, iteration 2 — full editability)
- Renamed marquee word "Hydroderm" → **"Hydrodermabrasion"** (trademark risk)
- Moved every remaining hardcoded string into `DEFAULT_CONTENT`: brand (logo/name/blurb/watermark), nav links + button labels, marquee words, hero extras (bg image, chapter label, CTAs, scroll hint), manifesto eyebrow, founder (eyebrow/plaque/stats/CTA), services (category images, item descriptions, closing + CTA notes), consultation (duration/includes/cost/labels), testimonials, footer column labels, mobile action bar
- Studio Editor: new tabs **Brand & menu, Scrolling words, Testimonials, Footer labels** plus extra fields on existing tabs
- **Live in-place editor** (`lib/liveEdit.jsx`): staff-only "Edit this page" toolbar on public pages; arms every `[data-edit]` node as contentEditable, Publish saves a diff to `/api/content`, Cancel reverts. Hidden for anonymous/client users and on `/studio`
- Fixed `PUT /api/content` to `replace_one` so "Reset all to defaults" actually clears overrides
- Verified by testing agent (iteration_4): 13 editor tabs render, marquee/brand/testimonials/footer edits persist, live editor publish survives reload, role gating correct, mobile clean

## SEO (2026-06, iteration 3)
- New editable **/faq** page (accordion, 6 default Q&As), linked in the footer (Explore + Legal columns); add/remove questions from the live editor's "+ Add question" or the Studio → FAQ tab
- Per-route SEO via `lib/seo.js` (`useSeo`): unique title/description/canonical/OG/Twitter per page, `noindex` on signin/signup/account/studio
- JSON-LD: MedicalBusiness/LocalBusiness + WebSite + Person (founder) in index.html; FAQPage (from editable content) on /faq and home; ReserveAction on /book; BreadcrumbList on /faq and legal pages
- `robots.txt` rewritten with AI/answer-engine bot rules (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, Bingbot); `sitemap.xml` rebuilt with lastmod + image entry + /faq (hash URLs removed); new **llms.txt** AI sitemap
- geo meta, hreflang/x-default, image CDN preconnect; fixed "Hydroderm Facial" → "Hydrodermabrasion Facial" in structured data
- Auth-gated routes emit noindex even during the auth-loading flash (noindex hoisted into `RequireAuth`); unknown URLs now redirect to `/` via a catch-all route
- Verified by testing agent (iteration_5): FAQ CRUD + live-editor add/remove persist across reload, all JSON-LD valid, per-route meta correct, static SEO files served 200

## Pop-up video (2026-06, iteration 4)
- Grand Opening video pop-up on the home page: opens 5s after load, once per browser session, muted autoplay + loop with an unmute toggle, rotating gold close button, "Book Consultation" CTA and "Maybe later" dismiss, Esc/backdrop close
- Video stored at `frontend/public/promo.mp4` with a VP9 `promo.webm` fallback source (headless/older browsers)
- Fully editable in **Studio → Editor → Pop-up video** (on/off, once-per-visit, file/URL, delay seconds, title, subtitle, button labels); title/subtitle/labels also live-editable

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
