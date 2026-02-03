# Artify — CREATE

A minimal ideation wizard for game developers. Turn your spark into a structured concept in minutes, not hours.

## Overview

CREATE is a focused ideation tool with two paths:

1. **Have an Idea** → Describe it → (Optionally) AI structures it → Export
2. **Need Help** → Fill Ikigai → Generate 10 sparks → Pick or remix → Export

That's it. No validation, no scope creep. Just ideation.

## Features

- **Modern Minimal UI**: Centered cards, clean typography, no sidebar clutter
- **Local-First**: All data stored in IndexedDB, no account needed
- **Optional AI**: Works fully without AI; enable for spark generation
- **Ikigai Discovery**: Visual 4-panel overlap finder for concept direction
- **SCAMPER & Matrix Mix**: Research-backed creativity techniques for remixing
- **Export**: Download Markdown concept doc and JSON backup

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Enabling AI Features

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-key-here
   NEXT_PUBLIC_ENABLE_AI=true
   ```

3. Restart the dev server

**Without AI**: Ikigai and manual remix worksheets work fully. You write your own ideas using SCAMPER/Matrix prompts.

**With AI**: Generates 10 idea sparks from your Ikigai, and can structure your existing ideas into concept cards.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Storage**: IndexedDB via `idb`
- **Icons**: Lucide React
- **AI**: OpenAI GPT-4o-mini (optional, server-side only)

## Project Structure

```
app/
  page.tsx              # Start screen
  idea/page.tsx         # Describe your idea (has idea path)
  ikigai/page.tsx       # Ikigai discovery (no idea path)
  sparks/page.tsx       # 10 idea sparks
  remix/page.tsx        # SCAMPER + Matrix Mix
  finalize/page.tsx     # Export concept
  validation/page.tsx   # AI validation results
  api/
    generateSparks/     # AI spark generation
    structureIdea/      # AI idea structuring
components/
  ui/                   # shadcn/ui components
  SparkCard.tsx         # Idea spark card
  WhyPopover.tsx        # Explanation popovers
hooks/
  useProject.ts         # Project state management
lib/
  types.ts              # TypeScript interfaces
  db.ts                 # IndexedDB operations
  prompts.ts            # AI prompt templates
  export.ts             # Markdown/JSON export
```

## The Flow

### Screen 1: Start
- Choose: "I have an idea" or "I need help"
- Quick context: Platform, Team Size, Timeline

### Screen 2A: Describe Idea (has idea)
- Write your pitch
- Add vibe chips (cozy, competitive, etc.)
- Optional: AI structures into concept card
- → Finalize

### Screen 2B: Ikigai (needs help)
- Add things to 4 categories (Love, Good At, Can Ship, Players Want)
- Items in 2+ categories are "overlaps"
- Need 8+ chips and 3+ overlaps to continue
- → Generate Sparks

### Screen 3B: 10 Sparks
- AI generates 10 idea cards
- Each has: title, pitch, verb, loop, twist
- Mark what you like about each
- Select one → Finalize
- Or "None of these" → Remix

### Screen 3C: Remix Loop
- Pick parts you liked from previous sparks
- Say what didn't work
- Choose SCAMPER mode or Matrix Mix elements
- Generate 10 new sparks
- Repeat until satisfied

### Screen 4: Finalize
- Edit title and concept
- View concept card summary
- Export: concept.md + project.json
- "Continue to Validation" → Coming Soon

## Manual QA Checklist

### Start Screen
- [ ] "Yes, I have an idea" selects properly
- [ ] "No, I need help" selects properly
- [ ] All 3 dropdowns work (Platform, Team, Timeline)
- [ ] Cannot continue without selection + all dropdowns
- [ ] Routes correctly based on selection

### Idea Path
- [ ] Textarea accepts input
- [ ] Vibe chips toggle on/off
- [ ] AI structure button appears when AI enabled
- [ ] AI structure populates result
- [ ] Continue routes to Finalize

### Ikigai Screen
- [ ] Can add chips with Enter key
- [ ] Can select multiple categories for a chip
- [ ] Chips appear in correct quadrants
- [ ] Overlap section shows chips with 2+ categories
- [ ] Progress bar updates
- [ ] Cannot continue until 8 chips + 3 overlaps
- [ ] Can remove chips

### Sparks Screen (AI enabled)
- [ ] Loads and generates 10 sparks
- [ ] Each card shows all details
- [ ] Can mark liked parts
- [ ] Can select a spark
- [ ] Selected spark routes to Finalize
- [ ] "None of these" routes to Remix
- [ ] "Generate 10 More" creates new round

### Sparks Screen (AI disabled)
- [ ] Shows manual worksheet message
- [ ] Routes to Remix

### Remix Screen
- [ ] Shows liked parts from previous sparks
- [ ] Dislike input works
- [ ] SCAMPER tab shows all 7 modes
- [ ] Matrix Mix tab has all 6 dropdowns
- [ ] Generate button calls API (or manual continue)
- [ ] Routes back to Sparks with new round

### Finalize Screen
- [ ] Title editable
- [ ] Concept editable
- [ ] Concept card shows context
- [ ] Download MD works
- [ ] Download JSON works
- [ ] Validation button routes to Coming Soon

### Coming Soon
- [ ] Shows placeholder content
- [ ] Back button works

### Global
- [ ] Data persists on refresh
- [ ] No console errors
- [ ] Mobile responsive layout
- [ ] All buttons have hover states

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables if using AI
4. Deploy

### Other Platforms

Any Next.js 14 host works:
```bash
npm run build
npm start
```

## Philosophy

- **Ideation only**: We don't validate ideas, we help you find them
- **Sparks, not solutions**: AI suggestions are starting points, not finished designs
- **Own it**: "Make it your own" is the ethos
- **No lock-in**: Export everything, store locally

## License

MIT

---

Built for game developers who want to move fast.
