# Location-Based Map Game

A Next.js 14 MVP that renders a Google Map with user geolocation, a 15-mile bounding box, Places API hotspots, theme overlays (Fantasy/Cyberpunk), and proximity-based encounter mechanics.

## Setup

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Environment Variables

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Google API keys:

   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Maps JavaScript API (client-side)
   - `GOOGLE_PLACES_API_KEY` — Places API Web Service (server-side)

### Enable Google APIs

In [Google Cloud Console](https://console.cloud.google.com/):

1. Create a project (or use an existing one)
2. Enable **Maps JavaScript API**
3. Enable **Places API** (Legacy)
4. Create API keys under APIs & Services > Credentials
5. Restrict keys: Maps key for `http://localhost:3000/*` (dev), Places key for server-only

### Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Choose a theme (Fantasy or Cyberpunk), allow geolocation, and explore hotspots. Use the "Use NYC mock location" toggle for consistent demos when geolocation is denied.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
