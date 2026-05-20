# Nexus Commerce — Storefront

Customer-facing storefront for **Nexus Commerce**, a showcase e-commerce platform. Built with Next.js 16 (App Router), TypeScript, and Tailwind v4.

Pairs with:
- API: [express-postgres-project](https://github.com/thunandar/express-postgres-project)
- Admin: [next-admin-panel](https://github.com/thunandar/next-admin-panel)

> Showcase / learning project — not production.

## Features

- Product browsing — categories, vendors, search, variant selection
- Cart + wishlist (React context, persisted)
- Checkout flow with addresses and order history
- Customer profile + saved addresses
- Journal (blog) reader
- Auth:
  - Email + password with **OTP** verification step
  - Google sign-in (skips OTP)
  - HttpOnly refresh cookie + silent access-token refresh
- Nexus Commerce design system — terracotta accent, warm off-white background, Instrument Serif display font

## Tech stack

- **Framework**: Next.js 16.1, React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4, Instrument Serif
- **HTTP**: axios with silent-refresh interceptor
- **Auth**: `@react-oauth/google` for Google sign-in
- **E2E**: Playwright

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in API_URL, NEXT_PUBLIC_API_URL, Google client ID
npm run dev
```

Opens on **http://localhost:3000**.

The backend must be running too — see `../express-postgres-project`. Locally the API also defaults to `:3000`, so either run the backend in Docker or point Next at a different port via env vars.

## Environment variables

| Variable | Description |
|---|---|
| `API_URL` | Backend URL used by Next.js server-side routes. Not exposed to the browser. |
| `NEXT_PUBLIC_API_URL` | Backend URL used by the browser (image URLs, client-side calls). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for the sign-in button. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional — test-mode Stripe key. |

## Auth flow

1. **Email / password registration** → backend issues an OTP via email → user submits OTP → account verified, tokens issued.
2. **Google sign-in** → ID token sent to backend → tokens issued (no OTP step).
3. Refresh token saved as HttpOnly cookie; access token returned to the client and stored in memory.
4. `proxy.ts` (Next middleware) checks for the `access_token` cookie's presence to gate `/shop/*` routes — it does **not** verify the signature (the backend is the source of truth).
5. On 401, the axios interceptor silently refreshes once and retries the failed request.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server on `:3000` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright suite |

## Deployment

Deployed on **Vercel** — auto-deploys on push to `main`. Env vars point to the Render-hosted backend.

See `../deployment.md` and `../vercel-env.md` for the full setup.

## License

[MIT](./LICENSE) © 2026 Thu Nandar Aye Min
