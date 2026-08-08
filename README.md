
# sujankumal — Blog & News site

This repository contains the source for a blog/news website published at https://sujankumal.com.np. The site focuses on articles, posts, and short-news updates, organized with categories, tags, and archives. It is implemented as a Next.js app and includes integrations for data (Prisma), styling (Tailwind), and optional Firebase features.

## Key technologies

- Next.js
- TypeScript
- Prisma (for data modeling and client generation)
- Tailwind CSS
- Firebase (optional client/server integrations under `/firebase`)

## Prerequisites

- Node.js 18+ (recommended)
- npm, yarn, or pnpm
- A database for Prisma (see `prisma/schema.prisma`) if you run migrations or generate the client for real data


## Local setup

1. Install dependencies

```bash
npm install
```

2. Create environment variables

Copy `.env.example` (if present) to `.env.local` and set values for DB, Firebase, and any auth providers used by the app.

3. Content

Content for the blog lives in the repository (markdown or source files under `public/data/markdown` and the `src/app` routes). Posts are organized by categories, tags, and date; the site supports archive pages and per-post pages.

4. Generate Prisma client (if you run migrations or use DB-backed features)

```bash
npm run prisma:generate
```

5. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000 to view the site.

## Build & production

To create an optimized production build:

```bash
npm run build
```

This runs `prisma generate` then `next build`. If you use a hosting platform (Vercel, Netlify, etc.), follow their Next.js/Node deployment guides.

## Tests & linting

If present, run tests and linters:

```bash
npm run lint
npm test
```

Adjust depending on which scripts are defined in `package.json`.

## Contributing

Contributions are welcome. Open an issue to discuss changes or submit a PR. Keep changes small and focused.

## License

This project is licensed under the Apache License 2.0 — see [LICENSE](LICENSE) for details.

---

If you'd like, I can also:

- Add a short development checklist to the README (env vars, common prisma commands)
- Create a `README.dev.md` with deeper local dev steps (migrations, seed data)
- Open a PR with this change and a small changelog entry
 
Tell me which of the above you'd like next.
