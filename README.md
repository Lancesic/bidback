# BidBack

BidBack is a simple contractor estimate follow-up mini CRM.

## What it does

- Tracks contractor estimates
- Shows open, won, and lost estimate value
- Shows due and overdue follow-ups
- Builds a Day 1, Day 3, Day 7, Day 14, and Day 30 follow-up sequence
- Lets testers call, text, email, copy scripts, and mark follow-ups sent
- Lets testers mark estimates won or lost
- Saves locally in the browser first
- Syncs tester signups and app data to Supabase when cloud settings are configured
- Includes a first-open tester form
- Includes a large Send Feedback button
- Opens the Tally feedback form at `https://tally.so/r/Gx5qYk`

## Tester experience

Text testers the Vercel link. They enter name, email, and phone once, then start using BidBack immediately.

When Supabase is configured, their signup appears in the `bidback_testers` table. Their current app data is saved in `app_data`, and quick totals are saved in `app_summary`.

## Cloud setup

Create a Supabase project, then run this SQL in the Supabase SQL editor:

```text
supabase/schema.sql
```

Add these environment variables in Vercel:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_TALLY_FEEDBACK_URL=https://tally.so/r/Gx5qYk
```

Use the Supabase service role key only as a server-side Vercel environment variable. Do not expose it publicly.

After this is configured:

- Every tester signup is saved in `bidback_testers`.
- Tester app data is stored in `app_data`.
- Feedback packages are stored in `bidback_feedback`.
- Tally still handles email notifications for feedback.

## Tally feedback setup

The app is wired to this Tally form:

```text
https://tally.so/embed/Gx5qYk?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1
```

For notifications, enable Tally email notifications to:

```text
lancebradleyadcock@gmail.com
```

BidBack passes these fields into Tally through the URL:

- `tester_name`
- `tester_email`
- `tester_phone`
- `tester_id`
- `comments`
- `summary`
- `app_data`

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

Connect this GitHub repo to Vercel.

Recommended Vercel settings:

- Framework: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: default

After deployment, text testers the Vercel URL.
