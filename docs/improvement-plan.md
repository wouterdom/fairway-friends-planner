# Fairway Friends - Improvement Plan

**Date:** February 8, 2026  
**Goal:** Add PocketBase backend, improve flow, fully functional Ryder Cup-style app

---

## Current Issues

### 1. Flow Problems
- **Disjointed navigation**: Pages don't guide users through a logical progression
- **No onboarding flow**: New users land on dashboard without setup guidance
- **Missing setup steps**: Course selection, handicap entry, tee selection are buried
- **Unclear progression**: From Players → Fixtures → Play is not intuitive

### 2. Dashboard Issues
- Still references removed features (Financials, payment tracking)
- Shows `preferences?.tripName` which doesn't exist anymore
- Stats grid includes irrelevant data

### 3. Backend Gap
- Only localStorage persistence
- No multi-device sync
- No user authentication
- Data lost if browser clears storage

---

## Business Rules (Golf Competition)

### Ryder Cup-Style Format

**Team Structure:**
- 2 teams: Team A vs Team B
- 6-12 players per team (flexible)
- Team captains assign players to matches
- Each match contributes points to overall team score

**Game Formats Supported:**

1. **Singles** (1v1)
   - 6 individual matches in a session
   - 1 point per match (win = 1, tie = 0.5)
   - Total: 6 points available per session

2. **Four-Ball** (Better Ball - 2v2)
   - Partners play own ball, best score counts
   - 3 matches per session (6 players per team)
   - 1 point per match
   - Total: 3 points available per session

3. **High-Low** (2v2)
   - 2 points for best score comparison
   - 1 point for worst score comparison
   - 3 matches per session
   - Total: 3 points available per session

4. **Foursomes** (Alternate Shot - 2v2)
   - Partners alternate shots with one ball
   - 3 matches per session
   - 1 point per match
   - Total: 3 points available per session

5. **Texas Scramble** (2v2 or 4v4)
   - Team plays one ball together
   - 3 matches per session
   - 1 point per match
   - Total: 3 points available per session

6. **Chapman** (Pinehurst - 2v2)
   - Both drive, switch balls for 2nd shot, pick best
   - 3 matches per session
   - 1 point per match
   - Total: 3 points available per session

**Scoring Types:**
- **Stableford**: Points-based (0-5 points per hole). Higher is better.
- **Stroke Play**: Total strokes. Lower is better.
- **Match Play**: Win holes, not total strokes. Most holes won wins match.

**Point Attribution:**
- Win = 1 point
- Tie = 0.5 points each
- Loss = 0 points
- Overall winning team = most points after all sessions

---

## Improved User Flow

### Flow Overview:

```
Landing Page
    ↓
Create/Join Trip (Auth required)
    ↓
Setup Wizard
    ├── Add Players (name, email, handicap)
    ├── Create Teams (Team A vs Team B)
    └── Assign Captains
    ↓
Dashboard (Main Hub)
    ├── Current Standings (Team points)
    ├── Recent Activity
    └── Quick Actions
    ↓
Session Management
    ├── Create Session (select date, course, format)
    ├── Captain Pairings (drag-drop matchups)
    └── Lock & Start
    ↓
Live Scoring
    ├── Select Match
    ├── Setup (course, tees, stroke table)
    ├── Enter Scores (hole-by-hole)
    └── Submit Results
    ↓
Leaderboard
    ├── Overall Standings
    ├── Session-by-Session
    ├── Individual Stats
    └── Match History
```

### Navigation Structure (4 items):

1. **Dashboard** (`/`)
   - Overall team standings
   - Current/next session info
   - Recent scores/match results
   - Quick actions (Start Scoring, Create Session)

2. **Sessions** (`/sessions`) - *Renamed from Fixtures*
   - List of all sessions (days)
   - Create new session
   - View session details and matchups
   - Captain pairing interface

3. **Play** (`/play`)
   - Active matches list
   - Select match to score
   - Live scoreboard
   - Match status (UP/DOWN/TIED)

4. **Players** (`/players`)
   - Team rosters
   - Player stats (wins, losses, points)
   - Add/edit players
   - Handicap tracking

---

## Database Schema (PocketBase)

### Collections:

#### 1. `trips`
```typescript
{
  id: string;
  name: string;           // "Scotland Golf Trip 2025"
  description: string;    // Optional trip description
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  status: 'setup' | 'active' | 'completed';
  createdBy: string;      // User ID relation
  inviteCode: string;     // For joining existing trips
  created: string;        // Timestamp
  updated: string;        // Timestamp
}
```

#### 2. `players` (Auth collection)
```typescript
{
  id: string;
  name: string;
  email: string;
  avatar?: string;
  handicap: number;       // Current handicap
  teamId: string;         // Relation to teams
  tripId: string;         // Relation to trips
  isCaptain: boolean;
  stats: {
    matchesPlayed: number;
    matchesWon: number;
    matchesLost: number;
    matchesTied: number;
    totalPoints: number;
  };
}
```

#### 3. `teams`
```typescript
{
  id: string;
  name: string;           // "Team Europe", "Team USA"
  tripId: string;         // Relation to trips
  color: string;          // Hex color
  captainId: string;      // Relation to players
  totalPoints: number;    // Aggregate from matches
  wins: number;
  losses: number;
  ties: number;
}
```

#### 4. `sessions` (formerly fixtureDays)
```typescript
{
  id: string;
  tripId: string;
  name: string;           // "Day 1 - St Andrews"
  date: string;
  courseName: string;
  courseLocation?: string;
  gameFormat: 'singles' | 'four-ball' | 'high-low' | 'foursomes' | 'texas-scramble' | 'chapman';
  scoringType: 'stableford' | 'strokeplay' | 'matchplay';
  status: 'draft' | 'pairing' | 'ready' | 'in_progress' | 'completed';
  teamALockedIn: boolean;
  teamBLockedIn: boolean;
  pointsAvailable: number;
  teamAPoints: number;    // Actual points earned
  teamBPoints: number;
}
```

#### 5. `matches`
```typescript
{
  id: string;
  sessionId: string;
  tripId: string;
  matchNumber: number;
  teamAPlayers: string[]; // Array of player IDs
  teamBPlayers: string[];
  status: 'pending' | 'in_progress' | 'completed';
  teamAPoints: number;
  teamBPoints: number;
  winnerTeamId?: string;
  courseTee?: string;
  strokeTable?: JSON;     // Course-specific stroke index
  startedAt?: string;
  completedAt?: string;
}
```

#### 6. `scores`
```typescript
{
  id: string;
  matchId: string;
  playerId: string;
  sessionId: string;
  tripId: string;
  holeScores: number[];   // Array of 18 gross scores
  netScores: number[];    // Calculated net scores
  stablefordPoints: number[]; // Points per hole
  totalGross: number;
  totalNet: number;
  totalStableford: number;
  isComplete: boolean;
  validatedHoles: boolean[]; // Which holes are confirmed
}
```

#### 7. `hole_results` (For detailed match tracking)
```typescript
{
  id: string;
  matchId: string;
  holeNumber: number;
  par: number;
  strokeIndex: number;
  teamAScore?: number;    // Best net for team A
  teamBScore?: number;    // Best net for team B
  winner?: 'team-a' | 'team-b' | 'halved';
  teamAPoints: number;    // Points earned this hole
  teamBPoints: number;
}
```

---

## Technical Implementation

### Phase 1: Setup & Infrastructure

**1.1 PocketBase Setup**
- Install PocketBase locally for development
- Create collections with proper relations
- Set up authentication rules
- Create admin user

**1.2 Frontend SDK Integration**
```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

// Auth state management
export const getCurrentUser = () => pb.authStore.model;
export const isAuthenticated = () => pb.authStore.isValid;
```

**1.3 Environment Configuration**
```bash
# .env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

### Phase 2: Authentication Flow

**2.1 Auth Context**
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

**2.2 Auth Pages**
- `/login` - Login form
- `/register` - Registration
- `/join/:inviteCode` - Join existing trip

### Phase 3: Data Layer (Hooks)

**3.1 Trip Hooks**
```typescript
// hooks/useTrips.ts
export const useTrip = (tripId: string) => {
  // Fetch single trip with all related data
};

export const useCreateTrip = () => {
  // Mutation to create trip
};
```

**3.2 Real-time Subscriptions**
```typescript
// hooks/useLiveScores.ts
export const useLiveScores = (matchId: string) => {
  useEffect(() => {
    const unsubscribe = pb.collection('scores')
      .subscribe('*', (data) => {
        if (data.record.matchId === matchId) {
          updateLocalState(data.record);
        }
      });
    return () => unsubscribe();
  }, [matchId]);
};
```

### Phase 4: Improved Components

**4.1 New Dashboard**
- Team standings card (big and prominent)
- Current/next session preview
- Recent match results
- Quick action buttons
- No financial references

**4.2 Session Management**
- Create session wizard
- Visual calendar view
- Pairing interface with drag-drop
- Match preview before locking

**4.3 Enhanced Play Flow**
```
Play Page:
├── Session Selector (dropdown)
├── Match Cards
│   ├── Team A vs Team B
│   ├── Status badge
│   └── Action button (Start/Continue)
└── Score Entry
    ├── Course Setup Dialog (on first open)
    ├── Hole-by-hole input
    ├── Real-time calculations
    └── Submit/Complete
```

**4.4 Leaderboard View**
- Team standings (primary)
- Individual stats (secondary tab)
- Session breakdown
- Match history

---

## File Structure Changes

```
src/
├── lib/
│   ├── pocketbase.ts       # NEW: PB client setup
│   ├── scoring.ts          # KEEP: Business logic
│   └── utils.ts            # KEEP
├── contexts/
│   ├── AuthContext.tsx     # NEW: Auth state
│   ├── TripContext.tsx     # MODIFY: Use PB instead of localStorage
│   └── LeaderboardContext.tsx # MODIFY: Use PB queries
├── hooks/
│   ├── useAuth.ts          # NEW: Auth operations
│   ├── useTrips.ts         # NEW: Trip CRUD
│   ├── useSessions.ts      # NEW: Session management
│   ├── useMatches.ts       # NEW: Match operations
│   └── useLiveScores.ts    # NEW: Real-time subscriptions
├── pages/
│   ├── Login.tsx           # NEW
│   ├── Register.tsx        # NEW
│   ├── Dashboard.tsx       # MODIFY: New layout
│   ├── Sessions.tsx        # RENAME: Formerly Fixtures
│   ├── Play.tsx            # MODIFY: Enhanced flow
│   ├── Players.tsx         # MODIFY: Team rosters
│   └── Leaderboard.tsx     # MODIFY: Full stats view
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── sessions/
│   │   ├── SessionList.tsx
│   │   ├── CreateSessionDialog.tsx
│   │   └── PairingManager.tsx
│   ├── play/
│   │   ├── MatchCard.tsx
│   │   ├── Scoreboard.tsx
│   │   └── CourseSetupDialog.tsx
│   └── leaderboard/
│       ├── TeamStandings.tsx
│       ├── IndividualStats.tsx
│       └── MatchHistory.tsx
└── types/
    ├── auth.ts             # NEW
    └── golf.ts             # MODIFY: Align with DB schema
```

---

## Migration Plan

### Step 1: Setup Backend
1. Download and run PocketBase locally
2. Create admin account
3. Import collection schema (from JSON)
4. Test API endpoints

### Step 2: Add Auth
1. Install pocketbase SDK
2. Create AuthContext
3. Build Login/Register pages
4. Protect existing routes

### Step 3: Migrate State
1. Replace localStorage with PB queries
2. Add loading states
3. Handle offline mode (cache + sync)

### Step 4: Improve UI Flow
1. Redesign Dashboard
2. Rename Fixtures → Sessions
3. Enhance Play flow with setup dialog
4. Add progress indicators

### Step 5: Add Real-time
1. Subscribe to score updates
2. Live match status
3. Instant leaderboard updates

---

## Docker Setup (Optional)

For easy local development:

```yaml
# docker-compose.yml
version: '3.8'
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_migrations:/pb_migrations
    environment:
      - POCKETBASE_ENCRYPTION_KEY=${PB_ENCRYPTION_KEY}
```

---

## API Endpoints Reference

### Authentication
- `POST /api/collections/players/auth-with-password`
- `POST /api/collections/players/confirm-verification`

### CRUD Operations
- `GET /api/collections/trips/records`
- `POST /api/collections/trips/records`
- `GET /api/collections/sessions/records?filter=tripId='xxx'`
- `GET /api/collections/matches/records?expand=teamAPlayers,teamBPlayers`

### Real-time
- `GET /api/realtime` (WebSocket endpoint)
- Subscribe to collections for live updates

---

## Success Criteria

✅ **Backend:**
- PocketBase running locally
- All collections created with proper relations
- Auth working (login/register)

✅ **Frontend:**
- Auth flow implemented
- All data synced to backend
- Real-time score updates
- Improved navigation flow

✅ **User Experience:**
- Clear progression: Setup → Play → Results
- No dead ends or confusing navigation
- Mobile-responsive
- Fast load times

✅ **Data Integrity:**
- All golf scoring rules implemented correctly
- Points calculated accurately
- Match results properly attributed
