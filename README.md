# PFC — Play. Compete. Belong.

A modular, mobile-first PFC web application built with **plain HTML, CSS and browser JavaScript**, using **Supabase** for authentication, database and private file storage.

## No Node.js or build tools

This version does not require Node.js, npm, React, Vite, a package manager, or a compilation/build step. The browser loads the HTML, CSS and JavaScript modules directly. The Supabase JavaScript client is loaded as an ES module from esm.sh; it runs in the browser and does not require Node.js.

## Run the application

1. Extract the ZIP.
2. Open `index.html` in a modern browser. For best results, serve the folder using any static web host or a simple local HTTP server. No build command is needed.
3. It opens in demo mode so you can review the player and operator portals.

Some browsers restrict JavaScript modules when opening files directly with a `file://` address. If that happens, upload the folder to a static host (for example, your web hosting file manager) or use a simple static-file server. This still does not require Node.js.

## Connect Supabase

1. Create a Supabase project.
2. Open `config.js` and enter your Supabase Project URL and anon/publishable key.
3. Set `demoMode: false`.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. Create a **private** Storage bucket named `payment-proofs` and follow `supabase/README.md`.
6. Enable Email authentication, turn on email confirmation, configure Site URL/Redirect URLs, and set up custom SMTP for reliable delivery. See `supabase/README.md`.
7. Create the first operator account, then promote it using the secure SQL instructions in `supabase/README.md`.

**Never put a Supabase service-role key, payment-provider secret or SMTP-provider secret in browser JavaScript.** The anon/publishable key is intended for browser use when Row Level Security is correctly configured.

## Account journey

Registration is intentionally minimal: email, password, password confirmation and acceptance of the Terms and Conditions. Supabase sends the verification email. After verification and first sign-in, the player completes full name, unique username and phone number. Sign-in uses email + password; username is the public player handle, not a direct Supabase login identifier. Forgot password sends a secure reset link by email.

The Terms and Conditions link opens `terms.html`, currently a clearly marked draft placeholder pending PFC legal/rules work. Image starter assets and replacement guidance are in `assets/images/`.

## What's included

- Player portal: email-and-password sign-in/register with email verification, resend-verification and email password recovery, competition discovery, registration, payment reference, receipt upload interface, profile, results and support.
- Operator portal: dashboard, player management, game library, game rules, tournaments, payment verification, support inbox, platform activity and settings.
- Demo mode with local sample data.
- Supabase schema, row-level security policies and private storage setup instructions.
- Separate JavaScript modules for pages, services, components and application state; separate CSS files for tokens, base styles, components and responsive layouts.

## Important before public launch

This is a reviewable application foundation, not a production launch certification. Connect and test Supabase Auth, database and private storage; configure email confirmation and SMTP; test every RLS policy with player and operator accounts; and implement a payment-provider integration with server-side verification/webhooks. Uploaded screenshots are evidence only and must never mark a payment as paid automatically. Complete Ugandan legal/regulatory review and finalise competition rules, tie-breakers, cancellation and refund terms before accepting real payments or public users.

## Folder structure

- `index.html` — application entry page
- `config.js` — browser-safe Supabase configuration
- `src/app/` — routing, shell and state
- `src/components/` — reusable UI and charts
- `src/pages/` — player and operator pages
- `src/services/` — authentication, games, tournaments, payments, players and support
- `src/styles/` — modular CSS
- `supabase/schema.sql` — database schema and policies
- `docs/` — implementation notes
