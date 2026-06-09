# Project G

Drop a CSV, ask a question, get charts and insights — all in your browser. Your data stays on your device.

**Live:** [projectg-beta.vercel.app](https://projectg-beta.vercel.app)

## How it works

1. Upload a CSV (HubSpot, Stripe, etc.)
2. Ask a question or pick a suggested prompt
3. Get insight cards with charts, narratives, and SQL you can trace
4. Export and leave — nothing is stored in the cloud

## Local development

```bash
npm install
cp .env.example .env   # add AI_GATEWAY_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
