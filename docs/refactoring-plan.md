# Fairway Friends Planner - Refactoring Plan

**Date:** February 8, 2026  
**Objective:** Strip down to core leaderboard and scoring functionality

---

## Overview

This plan details the step-by-step refactoring to remove non-core features and create a lean, focused golf scoring and leaderboard application.

**Remove:**
- Plan Your Trip wizard (`/setup`)
- Onboarding flow
- Financial tracking (`/financials`)
- Social feed (`/social`)
- Landing/marketing page (`/` - will redirect to leaderboard)
- Trip suggestion edge functions

**Keep:**
- Leaderboard (daily, flight, overall)
- Score entry and match management
- Player & team management
- Fixture scheduling

---

## Phase 1: Documentation & Setup

### Task 1.1: Initialize Git Repository
**Status:** ✅ COMPLETE (documentation created)

**Steps:**
1. Initialize git repo
2. Add remote: `https://github.com/sebastiencommeyne-cmd/fairway-friends-planner.git`
3. Create initial commit

---

## Phase 2: Remove Non-Core Pages & Routes

### Task 2.1: Remove Setup Page
**Files to Delete:**
- `src/pages/Setup.tsx` (989 lines)

**Files to Modify:**
- `src/App.tsx` - Remove `/setup` route

**Impact:** Removes entire trip planning wizard and onboarding flow.

---

### Task 2.2: Remove Financials Page
**Files to Delete:**
- `src/pages/Financials.tsx` (432 lines)

**Files to Modify:**
- `src/App.tsx` - Remove `/financials` route
- `src/contexts/TripContext.tsx` - Remove `expenses` state and related methods

**Impact:** Removes payment tracking and expense management.

---

### Task 2.3: Remove Social Page
**Files to Delete:**
- `src/pages/Social.tsx`

**Files to Modify:**
- `src/App.tsx` - Remove `/social` route
- `src/contexts/TripContext.tsx` - Remove `posts` state and related methods

**Impact:** Removes trip feed and social features.

---

### Task 2.4: Update Index/Landing Page
**Options:**
1. **Option A:** Delete `src/pages/Index.tsx` and redirect `/` to `/leaderboard`
2. **Option B:** Simplify `src/pages/Index.tsx` to minimal welcome screen

**Recommendation:** Option A - Direct entry to leaderboard

**Files to Modify:**
- `src/App.tsx` - Change `/` route to render Leaderboard component
- Optionally delete `src/pages/Index.tsx`

---

## Phase 3: Remove Component Directories

### Task 3.1: Remove Setup Components
**Directory to Delete:**
- `src/components/setup/` (entire directory)

**Contents:**
- `TripSuggestions.tsx` - AI trip suggestion display
- `TripEditor.tsx` - Trip customization interface
- `CourseMap.tsx` - Map component
- Any other setup-related components

---

### Task 3.2: Update Navigation
**Files to Modify:**
- `src/components/layout/Navigation.tsx`

**Changes:**
- Remove "Financials" nav item
- Remove "Social" nav item
- Simplify to core navigation:
  1. Leaderboard (renamed from Dashboard)
  2. Fixtures
  3. Play
  4. Players

---

## Phase 4: Simplify State Management

### Task 4.1: Update TripContext
**File:** `src/contexts/TripContext.tsx`

**Remove:**
```typescript
// State to remove:
- preferences: TripPreferences
- expenses: Expense[]
- posts: SocialPost[]

// Methods to remove:
- addExpense
- updateExpense
- removeExpense
- addPost
- updatePost
- removePost
- updatePreferences
```

**Keep:**
```typescript
// State to keep:
- players: Player[]
- teams: Team[]
- games: Game[]
- fixtureDays: FixtureDay[]

// Methods to keep:
- All player management
- All team management
- All game management
- All fixture management
```

---

### Task 4.2: Clean Up localStorage
**In TripContext.tsx:**

**Remove localStorage keys:**
- `golf-trip-preferences`
- `golf-trip-expenses`
- `golf-trip-posts`

**Keep localStorage keys:**
- `golf-trip-players`
- `golf-trip-teams`
- `golf-trip-games`
- `golf-trip-fixture-days`

---

## Phase 5: Update Type Definitions

### Task 5.1: Simplify Golf Types
**File:** `src/types/golf.ts`

**Types to Remove:**
```typescript
- TripPreferences
- TripSuggestion
- Expense
- ExpenseCategory
- SocialPost
- Comment
```

**Types to Keep:**
```typescript
- Player
- Team
- Game
- GameFormat (all variants)
- ScoringType
- FixtureDay
- Match
- MatchScore
- MatchResult
- DayStanding
- FlightStanding
- OverallStanding
```

---

## Phase 6: Update Routing

### Task 6.1: Update App.tsx Routes
**File:** `src/App.tsx`

**Current Routes:**
```typescript
<Route path="/" element={<Index />} />
<Route path="/setup" element={<Setup />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/players" element={<Players />} />
<Route path="/fixtures" element={<Fixtures />} />
<Route path="/financials" element={<Financials />} />
<Route path="/social" element={<Social />} />
<Route path="/play" element={<Play />} />
```

**New Routes:**
```typescript
<Route path="/" element={<Leaderboard />} />
<Route path="/players" element={<Players />} />
<Route path="/fixtures" element={<Fixtures />} />
<Route path="/play" element={<Play />} />
<Route path="*" element={<NotFound />} />
```

**Note:** Rename `Dashboard.tsx` to `Leaderboard.tsx` or update imports.

---

### Task 6.2: Rename Dashboard to Leaderboard
**Option 1:** Rename file
- Rename `src/pages/Dashboard.tsx` → `src/pages/Leaderboard.tsx`
- Update all imports

**Option 2:** Keep filename, update component name
- Keep as `Dashboard.tsx` but update component exports

**Recommendation:** Option 1 for clarity

---

## Phase 7: Remove Supabase Functions

### Task 7.1: Remove Trip Suggestion Function
**Directory to Delete:**
- `supabase/functions/suggest-trips/`

**Files:**
- `index.ts` (365 lines of AI trip suggestion logic)

**Note:** Keep other functions that may be useful:
- `places-autocomplete/`
- `discover-courses/`
- `get-mapbox-token/`

---

## Phase 8: Clean Up Dependencies

### Task 8.1: Review package.json
**File:** `package.json`

**Check for unused dependencies:**
- Any AI/LLM libraries (if specific to trip suggestions)
- Social-related libraries
- Any other removed feature dependencies

**Note:** Most dependencies are shared (React, UI components), so minimal changes expected.

---

## Phase 9: Testing & Verification

### Task 9.1: Test Core Functionality
**Test These Flows:**

1. **Add Players**
   - Add multiple players
   - Assign to teams
   - Set handicaps

2. **Create Fixtures**
   - Create fixture day
   - Add matches
   - Use pairing methods

3. **Enter Scores**
   - Start a game
   - Enter scores for each hole
   - Verify calculations

4. **View Leaderboard**
   - Check daily standings
   - Check flight standings
   - Check overall tournament standings

5. **Navigation**
   - Verify all nav links work
   - Check active states
   - Test mobile navigation

---

### Task 9.2: Build Verification
**Commands:**
```bash
npm run build
```

**Check:**
- No build errors
- No TypeScript errors
- Bundle size reasonable

---

## Phase 10: Documentation Update

### Task 10.1: Update README.md
**File:** `README.md`

**Update to reflect:**
- New simplified purpose
- Core features only
- Installation instructions
- Usage guide

---

## Implementation Order

**Recommended sequence:**

1. ✅ **Phase 1** - Documentation (COMPLETE)
2. **Phase 2** - Remove pages (Setup, Financials, Social)
3. **Phase 3** - Remove component directories
4. **Phase 4** - Simplify state management
5. **Phase 5** - Update type definitions
6. **Phase 6** - Update routing
7. **Phase 7** - Remove Supabase functions
8. **Phase 8** - Clean up dependencies
9. **Phase 9** - Testing
10. **Phase 10** - Update README

---

## Rollback Plan

**If issues arise:**

1. **Git History:** All changes committed incrementally
2. **Branch Strategy:** Work on feature branch
3. **Backup:** Original state preserved in git history

---

## Success Criteria

**✅ Refactoring Complete When:**

- [ ] No references to `/setup`, `/financials`, `/social` routes
- [ ] `src/components/setup/` directory removed
- [ ] `src/pages/Setup.tsx` deleted
- [ ] `src/pages/Financials.tsx` deleted
- [ ] `src/pages/Social.tsx` deleted
- [ ] Navigation shows only 4 items
- [ ] App entry point (`/`) shows leaderboard
- [ ] All TypeScript errors resolved
- [ ] Build completes successfully
- [ ] Core functionality tested and working
- [ ] Git repository synced to remote

---

## Files Affected Summary

### Files to Delete (8+ files):
1. `src/pages/Setup.tsx`
2. `src/pages/Financials.tsx`
3. `src/pages/Social.tsx`
4. `src/pages/Index.tsx` (optional)
5. `src/components/setup/TripSuggestions.tsx`
6. `src/components/setup/TripEditor.tsx`
7. `src/components/setup/CourseMap.tsx`
8. `supabase/functions/suggest-trips/index.ts`
9. Any other setup-related components

### Files to Modify (6 files):
1. `src/App.tsx` - Update routes
2. `src/components/layout/Navigation.tsx` - Update nav items
3. `src/contexts/TripContext.tsx` - Remove expenses/posts state
4. `src/types/golf.ts` - Remove unused types
5. `README.md` - Update documentation
6. `package.json` - Remove unused dependencies (if any)

### Files to Rename (1 file):
1. `src/pages/Dashboard.tsx` → `src/pages/Leaderboard.tsx` (optional)

---

## Estimated Effort

- **Phase 2 (Remove Pages):** 30 minutes
- **Phase 3 (Remove Components):** 15 minutes
- **Phase 4 (State Management):** 45 minutes
- **Phase 5 (Type Definitions):** 30 minutes
- **Phase 6 (Routing):** 20 minutes
- **Phase 7 (Supabase):** 10 minutes
- **Phase 8 (Dependencies):** 10 minutes
- **Phase 9 (Testing):** 30 minutes
- **Phase 10 (Docs):** 20 minutes

**Total Estimated Time:** ~3.5 hours

---

## Notes

- The codebase uses shadcn/ui components which should be kept
- Radix UI primitives are used throughout - keep all
- Tailwind CSS config remains unchanged
- Vite configuration remains unchanged
- LocalStorage data migration: Old keys will be ignored, users start fresh
