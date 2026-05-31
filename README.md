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
- Sends feedback to `lancebradleyadcock@gmail.com`

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
