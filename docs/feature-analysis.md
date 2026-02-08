# Fairway Friends Planner - Feature Analysis

**Date:** February 8, 2026  
**Current Version:** Golf trip management app with full features  
**Target Version:** Lean leaderboard and scoring app

---

## Overview

Fairway Friends Planner is a React-based web application for managing golf trips with friends. It includes features for trip planning, player management, match scheduling, live scoring, and leaderboard tracking.

**Goal:** Strip down to core functionality focused on:
- Leaderboard tracking
- Score entry and match management
- Player/team management

---

## Features Inventory

### ✅ KEEP - Core Features

#### 1. Leaderboard System
**Location:** `src/components/leaderboard/`, `src/contexts/LeaderboardContext.tsx`

**Components:**
- `DailyLeaderboard.tsx` - Day-by-day standings
- `FlightLeaderboard.tsx` - Per-flight/group rankings
- `OverallLeaderboard.tsx` - Tournament-wide standings
- `LeaderboardView.tsx` - Container component

**Functionality:**
- Tracks player scores across multiple game formats
- Supports team vs team competitions
- Real-time match status (UP/DOWN/TIED)
- Customizable flight colors
- Multiple scoring types (Stableford, Strokeplay, Matchplay)

#### 2. Score/Match Management
**Location:** `src/pages/Play.tsx`, `src/pages/Fixtures.tsx`, `src/components/play/`

**Components:**
- `GameScoreboardDialog.tsx` - Live score entry interface
- `MatchScoreboard.tsx` - Match status display
- `MatchHistory.tsx` - Completed match results
- `CaptainFixtureManager.tsx` - Drag-and-drop fixture pairing

**Supported Game Formats:**
- **Singles** - 1v1 match
- **High-Low** - Better ball format
- **Four-Ball** - Better ball of partners
- **Texas Scramble** - Team scramble
- **Foursomes** - Alternate shot
- **Chapman** - Pinehurst format

**Scoring Types:**
- Stableford (points-based)
- Strokeplay (total strokes)
- Matchplay (hole-by-hole)

#### 3. Player & Team Management
**Location:** `src/pages/Players.tsx`

**Functionality:**
- Add/edit/remove players
- Track handicaps
- Assign players to teams (Team A / Team B)
- Designate team captains
- Payment status tracking (though Finance page removed)

#### 4. Fixture Management
**Location:** `src/components/fixtures/`

**Components:**
- `CaptainFixtureManager.tsx` - Drag-drop pairing interface
- `CreateFixtureDayDialog.tsx` - Add new game days
- `FixtureDayView.tsx` - Day schedule display

**Features:**
- Create fixture days with date and course
- Multiple pairing methods:
  - Handicap-based pairing
  - Random pairing
  - Manual pairing
- Lock-in team assignments
- Generate flights automatically

---

### ❌ REMOVE - Non-Core Features

#### 1. Plan Your Trip (Setup Wizard)
**Location:** `src/pages/Setup.tsx`, `src/components/setup/`

**Components to Remove:**
- `Setup.tsx` (989 lines) - Main wizard page
- `TripSuggestions.tsx` - AI-generated trip options
- `TripEditor.tsx` - Trip customization interface
- `CourseMap.tsx` - Map display for courses

**Features Being Removed:**
- Multi-step trip planning wizard (6 steps)
- AI-powered trip suggestions
- Course discovery via Google Places API
- Travel mode selection (driving/flying)
- Accommodation preferences
- Day-by-day game format scheduling
- Loading states and suggestion generation

**Reason:** This is trip planning/planning phase functionality. The stripped-down app assumes the trip is already planned.

#### 2. Onboarding Flow
**Location:** Part of `src/pages/Setup.tsx`

**Being Removed:**
- Step-by-step wizard for initial setup
- Player addition during setup phase
- Trip preferences configuration
- First-time user guidance

**Reason:** Streamline to core scoring functionality. Assume users know how to use the app.

#### 3. Financial Tracking
**Location:** `src/pages/Financials.tsx`

**Features Being Removed:**
- Payment collection tracking
- Expense logging and categorization
- Per-player payment progress bars
- Expense splitting between players
- Budget overview and totals
- Payment status indicators

**Reason:** Not core to golf scoring and leaderboard functionality.

#### 4. Social Feed
**Location:** `src/pages/Social.tsx`

**Features Being Removed:**
- Trip feed with posts
- Photo sharing (placeholder)
- Comments and likes on posts
- Social interaction features

**Reason:** Nice-to-have but not essential for scoring/leaderboard core purpose.

#### 5. Landing/Marketing Page
**Location:** `src/pages/Index.tsx`

**Features Being Removed:**
- Marketing content and hero section
- Feature highlights
- Call-to-action buttons

**Reason:** App should start directly at the dashboard/leaderboard for users.

#### 6. Supabase Edge Functions
**Location:** `supabase/functions/`

**Being Removed:**
- `suggest-trips/index.ts` - AI trip suggestion logic (365 lines)

**Keeping:**
- `places-autocomplete/` - May be useful for course lookup
- `discover-courses/` - May be useful for course discovery
- `get-mapbox-token/` - Needed if maps kept

---

## Navigation Changes

### Current Navigation Items:
1. Play Game
2. Dashboard
3. Fixtures
4. Players
5. Financials ❌
6. Social ❌

### New Navigation Items:
1. **Play** - Active game scoring
2. **Leaderboard** - Combined dashboard + leaderboard view
3. **Fixtures** - Schedule and match setup
4. **Players** - Player and team management

---

## Data Model Simplifications

### TripContext State (simplified):
**Remove:**
- `preferences: TripPreferences` - Trip planning preferences
- `expenses: Expense[]` - Financial tracking
- `posts: SocialPost[]` - Social feed data

**Keep:**
- `players: Player[]` - Player roster
- `teams: Team[]` - Two teams with players
- `games: Game[]` - Games with scores
- `fixtureDays: FixtureDay[]` - Schedule and matchups

### LeaderboardContext State:
**Keep as-is:**
- `matchScores`, `matchResults`
- `currentPlayerIdentification`
- `flightColor`
- `selectedDayId`
- `viewMode`

---

## Type Definitions Simplifications

### Types to Remove:
- `TripPreferences` - Trip planning preferences
- `TripSuggestion` - AI suggestion data
- `Expense` - Financial tracking
- `ExpenseCategory` - Expense categorization
- `SocialPost` - Social feed posts
- `Comment` - Social comments

### Types to Keep:
- `Player` - Player data (name, handicap, teamId, etc.)
- `Team` - Team data (id, name, players, captainId)
- `Game` - Game/score data
- `FixtureDay` - Schedule data (date, course, matches, etc.)
- `Match` - Individual matchup data
- `MatchScore` - Score entry per player
- `MatchResult` - Match outcome data
- Game format types (SinglesGame, FourBallGame, etc.)

---

## Routes Changes

### Current Routes:
| Route | Component | Action |
|-------|-----------|--------|
| `/` | `Index` | Remove or redirect |
| `/setup` | `Setup` | Remove entirely |
| `/dashboard` | `Dashboard` | Keep (simplify) |
| `/players` | `Players` | Keep |
| `/fixtures` | `Fixtures` | Keep |
| `/financials` | `Financials` | Remove |
| `/social` | `Social` | Remove |
| `/play` | `Play` | Keep |

### New Routes:
| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `Leaderboard` | Entry point - leaderboard view |
| `/players` | `Players` | Player management |
| `/fixtures` | `Fixtures` | Fixture scheduling |
| `/play` | `Play` | Active game scoring |

---

## LocalStorage Keys

### Keys to Keep:
- `golf-trip-players`
- `golf-trip-teams`
- `golf-trip-fixture-days`
- `golf-trip-games`
- `golf-match-scores-{matchId}`
- `golf-match-setup-{matchId}`

### Keys to Remove:
- `golf-trip-preferences`
- `golf-trip-expenses`
- `golf-trip-posts`

---

## Summary

**After refactoring, the app will be a focused golf scoring and leaderboard tool:**

1. **Leaderboard View** - Primary entry point showing current standings
2. **Fixtures** - Set up match schedules and pairings
3. **Play** - Enter scores during active games
4. **Players** - Manage roster and team assignments

**No more:**
- Trip planning wizard
- Payment tracking
- Social features
- Onboarding flows
- Marketing landing pages

The app assumes users already know their trip details and just want to track scores and see who is winning!
