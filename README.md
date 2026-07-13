# MoHEST Platform

A staged build toward the full enterprise platform described in the original
brief. This package contains what's genuinely finished, plus a real foundation
for what isn't — nothing in here is a hollow mockup pretending to be more than
it is.

## What's in this zip

```
mohest-platform/
├── public-site/          Complete, working public website — 15 pages
├── enterprise-portal/     Login + one sample role dashboard (static UI, not wired to the backend yet)
└── backend/               NestJS + Prisma + PostgreSQL — real auth, RBAC, and schema foundation
```

### `public-site/` — fully built

All pages from the brief: Home, About, Leadership, Departments, Universities,
Institutes, Community Colleges, Admission Policies, Certificate Equivalence,
Foreign Scholarships (information only, no application flow — as specified),
News, Media Centre, Downloads, Contact, and Global Search.

Open `public-site/index.html` directly in a browser, or serve the folder with
any static server (`npx serve public-site`). Shared design system lives in
`public-site/assets/styles.css` and `public-site/assets/main.js` (the
parallax/scroll-reveal engine already refined over several rounds — phase-locked
dot-grid backgrounds, IntersectionObserver-gated for performance, full
`prefers-reduced-motion` support).

The footer's "Staff Portal" text link points to `enterprise-portal/login.html`.

### `enterprise-portal/` — visual direction only

A login screen and one sample ICT Administrator dashboard, in a deliberately
different visual language from the public site (Stripe/Linear/Notion-inspired,
per the brief) to show the split between "citizen-facing government site" and
"internal SaaS tool." **These are static HTML mockups** — the login form
doesn't authenticate against anything real yet. They exist to lock down the
visual direction before investing in the full dashboard framework, RBAC admin
UI, HR module, ID card designer, and document generator described in the
original brief — each of which is a substantial build in its own right.

### `backend/` — real foundation, not a full system

A working NestJS API: Argon2 password hashing, JWT auth with rotating refresh
tokens, and a **fully dynamic RBAC system** — permissions are rows in a
database table, not hardcoded enums, checked fresh on every request. The
Prisma schema covers identity/RBAC, departments (self-referencing, so Finance/
Procurement/Legal/etc. can be added later with zero schema changes), and the
full HR entity set. See `backend/README.md` for what's implemented vs. what's
scaffolded-but-not-built, and exact setup steps.

## Honest scope note

The original brief describes a genuinely large system — a full HR platform,
an ID card designer, a document generator, per-role dashboards, and enough
department modules to eventually cover Finance, Procurement, Scholarships,
Legal, Registry, Planning, and Internal Audit. That's realistically a
multi-month build for a small team, not something that comes out right in a
handful of chat responses. Rather than generate a huge pile of code with
hidden gaps across all of it, this package prioritizes:

1. A public site that's actually finished and correct today.
2. A backend foundation (auth + RBAC + schema) solid enough that every later
   module has real infrastructure to build on, instead of needing to be
   rebuilt.
3. Clear, honest documentation of exactly what's next and in what order.

