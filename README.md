# T2PKs Properties & T2PKs Loans

Two independent workspaces in one blue-and-white, Vercel-ready React app.

## Local setup

Requires Node.js 24+.

```sh
npm install
cp .env.example .env.local
# Set the project URL and publishable key in .env.local.
npm run dev
```

The current checkout is already configured for the `PropertyRentalAndLoanBusiness` Supabase project. `.env.local` is ignored by Git. Only the browser-safe publishable key is used; there is no service-role key in this application.

## Demo / Live toggle

The top bar switches data sources for both Properties and Loans without changing the design.

**Demo** starts with fictional sample records. Edits work during the current preview but exist only in memory. Refreshing the page, resetting the demo, or switching from Live back to Demo restores fresh sample records. Demo edits are never written to Supabase or browser storage. The previous `t2pks-demo-v1` localStorage snapshot is retired automatically. Refreshing always opens Demo mode.

**Live** uses Supabase Auth and private database records. Choose Live, then create an app account or sign in. The Supabase dashboard login is separate from this application’s login. Confirm your email if requested. Live workspaces start empty: no sample records are imported. Each authenticated account owns one private workspace containing both businesses. Use the same account on another device to access the same records. This MVP does not provide team invitations or shared organisation accounts.

Live saves wait for database acknowledgement before showing success. Failed saves keep form values and display errors. A revision check rejects outdated writes from another tab instead of overwriting newer data. Use **Reload live records** in the top bar to fetch changes from another device. The demo reset control is not available in Live mode. Signing out clears the displayed live records. Only the authentication session is persisted in browser storage; live business data is loaded from Supabase.

## Features

- `/properties`: overview, tenants, properties and rooms, rent payments and invoices, maintenance, complaints, reports.
- `/loans`: overview, clients, loan register, repayments, pay-later agreements, reports.
- `/workspaces`: shared business switchboard.

Rent payments are allocated to a specific month and automatically receive an invoice number. Invoices can be viewed, downloaded as HTML, or printed/saved as PDF. Tenant reports include contact details, deposits, payment history, concerns and room maintenance. Archive a tenant who has moved out to release their room while retaining their records. Vacancy reports show occupancy, vacancy rates, rental ranges and vacant room rent value. CSV exports are available throughout.

Loan records contain the principal, manually agreed total and original due date. Repayments update balances and settle fully paid loans. Overpayments are rejected. Pay-later agreements preserve the original due date while recording a separate promised date and note. No automatic interest, late fees or collection messages are generated.

## Database

Project: `algoaikjjmlvvfbpmpso` (`PropertyRentalAndLoanBusiness`).

The schema in `supabase/migrations/202610230001_business_workspaces.sql` has been applied using the project’s SQL Editor. The existing CLI session belongs to another account, so it was not used to modify this project.

For this small MVP, `public.business_workspaces` stores a versioned JSON document per `auth.users` owner. The application’s typed records remain separate inside that document. A single transaction saves related changes, including a payment and its invoice ID, together. Row-level security restricts reads, inserts and updates to the signed-in owner. Anonymous table access and save-function execution are revoked. `save_business_workspace` compares revisions to reject stale writes. A later phase can move the document’s arrays into individual relational tables without changing the screens.

Local email-confirmation redirect: `http://localhost:5173`. For deployment, add the exact Vercel URL under Supabase **Authentication → URL Configuration → Redirect URLs**, and set the Site URL to the main deployment URL. Keep email confirmation enabled.

## Vercel

Import the repo with framework **Vite**, build command `npm run build`, output directory `dist`, and Node.js 24. Add these public client configuration variables to Vercel, then redeploy:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Use the values from this checkout’s ignored `.env.local`, or the project’s API Keys page. Do not place a Supabase secret/service-role key in any `VITE_` variable. `vercel.json` supports deep links, so both businesses use the same Vercel deployment.

## Verification

```sh
npm test
npm run build
node --env-file=.env.local scripts/verify-supabase.mjs
```

Tests cover partial rent allocation, move-in dates, vacancies, loan balances, settlement, payment promises, empty live data, fresh demo data and save acknowledgements. The API verification checks Auth availability and rejects anonymous reads/writes. Database checks in the SQL Editor verified owner saves/updates, revision conflicts and cross-owner isolation in a rolled-back transaction; no test accounts or records were retained.

## Current limits

Invoice email delivery is not connected. No messages or payment transactions are sent by this app. Invoice contact/room details use current records; an immutable invoice snapshot is a later enhancement. Monthly rent reports use the room’s current rate and currently active tenant roster, without historical lease schedules or proration. Deposits are recorded separately from rent. Occupancy is current even when viewing older rent periods. Maintenance costs are grouped by the logged date. Loan reports summarise agreed amounts, not earned profit. Dates use South African display conventions and amounts are in ZAR.

Authentication, owner-scoped storage and the toggle are connected. End-to-end email confirmation/sign-in needs the first business owner to create their own account. Automated email delivery, team access, audit history and historical lease/rate snapshots remain separate follow-up work.
