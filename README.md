# BidBack

BidBack is a simple contractor estimate follow-up mini CRM.

## What it does

- Tracks contractor estimates
- Shows open, won, and lost estimate value
- Shows due and overdue follow-ups
- Builds a Day 1, Day 3, Day 7, Day 14, and Day 30 follow-up sequence
- Lets testers call, text, email, copy scripts, and mark follow-ups sent
- Lets testers mark estimates won or lost
- Saves locally in the browser
- Includes a first-open tester form
- Includes a large Send Feedback button
- Opens a Tally feedback form when configured
- Falls back to email feedback to `lancebradleyadcock@gmail.com` if Tally is not configured

## Tally feedback setup

Create a Tally form with these fields:

- Comments, long answer
- Tester name, hidden field named `tester_name`
- Tester email, hidden field named `tester_email`
- Tester phone, hidden field named `tester_phone`
- Summary, hidden field named `summary`
- App data, hidden field named `app_data`

In Tally, enable email notifications to `lancebradleyadcock@gmail.com`.

In Vercel, add this environment variable:

```text
NEXT_PUBLIC_TALLY_FEEDBACK_URL=https://tally.so/r/YOUR_FORM_ID
```

Then redeploy the site. After that, the **Send Feedback** button opens the Tally form and Tally sends the notification.

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
