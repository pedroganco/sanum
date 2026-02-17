# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sanum** is an MVP web app that interprets medical lab results in seconds using AI. Privacy-first architecture—no data is ever stored on the server.

**Target users:** Portuguese individuals who want to understand their blood test results without waiting for doctor appointments.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **PDF Processing:** poppler-utils (`pdftotext`)
- **Deployment:** Docker + Traefik reverse proxy
- **Hosting:** VPS 94.46.171.243 (shared with PPQQ)

## Development Setup

### Prerequisites

```bash
# Required
node >= 20
pdftotext (poppler-utils)

# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils
```

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add ANTHROPIC_API_KEY=sk-ant-...

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

### Available Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check (if configured)
```

## Architecture

### File Structure

```
sanum/
├── app/
│   ├── page.tsx              # Main page: upload, dashboard, AI analysis
│   ├── api/
│   │   ├── parse/route.ts    # POST /api/parse - Extract markers from PDF
│   │   └── analyze/route.ts  # POST /api/analyze - AI global analysis
│   └── globals.css           # Tailwind imports
├── components/
│   ├── Disclaimer.tsx        # Medical disclaimer (always visible)
│   ├── UploadSection.tsx     # Drag & drop PDF upload
│   ├── Dashboard.tsx         # Traffic light dashboard 🟢🟡🔴
│   ├── MarkerCard.tsx        # Individual marker card
│   ├── MarkerModal.tsx       # Modal with marker explanation
│   └── AIAnalysisSection.tsx # CTA + AI analysis result
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── markers-database.ts   # ~80 Portuguese markers (hardcoded, no AI)
├── docs/
│   ├── SPEC.md               # Full specification
│   └── sample-germano-de-sousa.pdf  # Test file
└── Dockerfile                # Production container
```

### Key Design Decisions

1. **Privacy-First:**
   - PDFs processed in memory only
   - NO database, NO file storage
   - User data never leaves the server's memory
   - Each request is stateless

2. **Hybrid AI Approach:**
   - Marker explanations: Hardcoded database (zero AI, instant, free)
   - Global analysis: Claude API (on-demand, user-initiated)

3. **Rate Limiting:**
   - Parse endpoint: 10 requests per 15 min per IP
   - Analyze endpoint: 20 requests per 15 min per IP
   - Prevents abuse + protects Anthropic API costs

4. **Mobile-First:**
   - Responsive design
   - Touch-friendly interactions
   - Works on phones/tablets

## Coding Conventions

### TypeScript

- Use strict mode
- Prefer interfaces over types for data structures
- No `any` types (use `unknown` if truly needed)

### React Components

- Functional components only
- Use hooks (useState, useEffect, etc.)
- Client components: Add `'use client'` directive
- Server components: Default, no directive needed

### Styling

- Tailwind CSS v4 utility classes
- No custom CSS unless absolutely necessary
- Consistent spacing: `p-4`, `gap-4`, `space-y-4`

### API Routes

- Always validate input with zod or similar
- Return consistent error format: `{ error: string }`
- Use proper HTTP status codes (400, 429, 500)

### Environment Variables

**NEVER commit .env files to git.**

Required in `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Critical Rules

### 🚫 DO NOT

- Store user PDFs on disk or database
- Log sensitive medical data
- Skip rate limiting checks
- Remove the medical disclaimer
- Use patient data for analytics/tracking
- Make marker explanations dynamic (they MUST be from hardcoded database)

### ✅ DO

- Keep privacy-first architecture
- Validate all user inputs
- Handle errors gracefully (user-friendly messages)
- Maintain rate limits
- Test with sample PDF before deploying
- Keep marker database accurate (medical info is critical)

## Testing

### Manual Testing

```bash
# Start dev server
npm run dev

# Upload sample PDF
# File: docs/sample-germano-de-sousa.pdf
# Expected: ~15-20 markers parsed, dashboard with traffic lights
```

### Before Deploy

1. ✅ Test PDF upload flow
2. ✅ Verify rate limiting works
3. ✅ Check disclaimer is visible
4. ✅ Test AI analysis (requires API key)
5. ✅ Test on mobile viewport

## Deployment

### Docker Build

```bash
docker build -t sanum .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... sanum
```

### VPS Deployment (94.46.171.243)

- Deploy via Docker + Traefik
- SSH: `ganco@94.46.171.243`
- Container name: `sanum`
- Domain: TBD (configure Traefik labels)

## Roadmap (v1.1)

- [ ] OCR for scanned PDFs (Claude Vision API)
- [ ] Temporal evolution charts (track changes over time)
- [ ] localStorage to save user results (privacy-preserving)
- [ ] Export PDF report
- [ ] Expand marker database (100+ markers)

## Common Tasks

### Add a new marker to database

1. Open `lib/markers-database.ts`
2. Add to appropriate category array
3. Include: name, unit, normalRange, category, explanation
4. Ensure explanation is medically accurate (consult sources)

### Modify rate limits

1. Edit `app/api/parse/route.ts` or `app/api/analyze/route.ts`
2. Change constants at top of file
3. Test with rapid requests to verify

### Update AI prompt

1. Edit `app/api/parse/route.ts` (extraction prompt)
2. Or `app/api/analyze/route.ts` (global analysis prompt)
3. Test with sample PDF to ensure quality

## Troubleshooting

**pdftotext not found:**
```bash
# macOS
brew install poppler

# Docker
# Already included in Dockerfile
```

**Anthropic API errors:**
- Check .env.local has valid ANTHROPIC_API_KEY
- Verify API key has credits
- Check rate limits on Anthropic dashboard

**Rate limit not working:**
- Check IP detection logic
- Verify in-memory store is not being cleared (server restart clears it)

## Resources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- Portuguese lab reference ranges: Various medical sources (see SPEC.md)

---

**Last updated:** 2026-02-17
