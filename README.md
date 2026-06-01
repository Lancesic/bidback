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
- Opens the Tally feedback form at `https://tally.so/r/Gx5qYk`

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
