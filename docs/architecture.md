# Fairway Friends Planner - Architecture Documentation

**Date:** February 8, 2026  
**Version:** Post-refactoring (Leaderboard & Scoring Focus)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | React 18.3 | UI library |
| **Build Tool** | Vite 5.4 | Development server & bundling |
| **Language** | TypeScript 5.8 | Type safety |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **UI Components** | Radix UI + shadcn/ui | Accessible component primitives |
| **State Management** | React Context + localStorage | App state & persistence |
| **Routing** | React Router 6.30 | Client-side navigation |
| **Data Fetching** | TanStack Query 5.83 | Server state management |
| **Backend** | Supabase | Auth, database, edge functions |
| **Maps** | Mapbox GL | Course maps (optional) |

---

## Project Structure

```
fairway-friends-planner/
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles + Tailwind
│   ├── pages/                  # Page components (routes)
│   │   ├── Leaderboard.tsx     # Main entry - leaderboard view
│   │   ├── Players.tsx         # Player & team management
│   │   ├── Fixtures.tsx        # Schedule & pairings
│   │   ├── Play.tsx            # Active game scoring
│   │   └── NotFound.tsx        # 404 page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (45+)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/             # App layout components
│   │   │   ├── Navigation.tsx  # Side/top navigation
│   │   │   ├── AppLayout.tsx   # App shell with nav
│   │   │   └── PageHeader.tsx  # Page title + actions
│   │   ├── leaderboard/        # Leaderboard components
│   │   │   ├── LeaderboardView.tsx
│   │   │   ├── DailyLeaderboard.tsx
│   │   │   ├── FlightLeaderboard.tsx
│   │   │   └── OverallLeaderboard.tsx
│   │   ├── fixtures/           # Fixture management
│   │   │   ├── CaptainFixtureManager.tsx
│   │   │   ├── CreateFixtureDayDialog.tsx
│   │   │   └── FixtureDayView.tsx
│   │   └── play/               # Score entry components
│   │       ├── GameScoreboardDialog.tsx
│   │       ├── MatchScoreboard.tsx
│   │       └── MatchHistory.tsx
│   ├── contexts/               # React Context providers
│   │   ├── TripContext.tsx     # Main app state
│   │   └── LeaderboardContext.tsx  # Leaderboard state
│   ├── lib/                    # Utility functions
│   │   ├── scoring.ts          # Golf scoring algorithms
│   │   ├── strokeTable.ts      # Handicap stroke tables
│   │   └── utils.ts            # General utilities (cn, etc.)
│   ├── types/                  # TypeScript definitions
│   │   └── golf.ts             # All golf-related types
│   ├── hooks/                  # Custom React hooks
│   │   └── useGolfScoring.ts   # Scoring calculations
│   └── integrations/
│       └── supabase/
│           ├── client.ts       # Supabase client config
│           └── types.ts        # Database types
├── supabase/
│   └── functions/              # Edge functions
│       ├── places-autocomplete/   # Google Places API
│       ├── discover-courses/      # Course discovery
│       └── get-mapbox-token/      # Mapbox auth
├── public/                     # Static assets
├── docs/                       # Documentation
│   ├── feature-analysis.md
│   ├── architecture.md
│   └── refactoring-plan.md
├── package.json
├── vite.config.js
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## State Management Architecture

### 1. TripContext (Main State)

**Location:** `src/contexts/TripContext.tsx`

**Purpose:** Manages core application data - players, teams, games, fixtures.

**State Shape:**
```typescript
interface TripContextState {
  // Core data
  players: Player[];           // All players in the trip
  teams: Team[];               // Two teams (Team A, Team B)
  games: Game[];               // Completed/in-progress games
  fixtureDays: FixtureDay[];   // Schedule per day
  
  // Actions
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  
  updateTeamName: (teamId: string, name: string) => void;
  setCaptain: (teamId: string, playerId: string) => void;
  
  addGame: (game: Game) => void;
  updateGameScore: (gameId: string, scores: MatchScore[]) => void;
  markGameComplete: (gameId: string) => void;
  
  addFixtureDay: (day: FixtureDay) => void;
  updateFixtureDay: (id: string, updates: Partial<FixtureDay>) => void;
  lockInTeam: (dayId: string, teamId: string) => void;
}
```

**Persistence:** All data saved to localStorage for offline support.

---

### 2. LeaderboardContext (Leaderboard State)

**Location:** `src/contexts/LeaderboardContext.tsx`

**Purpose:** Manages leaderboard-specific state and calculations.

**State Shape:**
```typescript
interface LeaderboardContextState {
  // View state
  currentPlayerIdentification: string;  // Current user's player ID
  flightColor: string;                  // Custom flight color (hex)
  selectedDayId: string | null;         // Currently viewed fixture day
  viewMode: 'team' | 'individual';      // Leaderboard view type
  
  // Match data
  matchScores: MatchScore[];            // All player scores
  matchResults: MatchResult[];          // Match outcomes
  
  // Actions
  updateMatchScore: (matchId: string, playerId: string, hole: number, score: number) => void;
  updateMatchResult: (matchId: string, result: MatchResult) => void;
  
  // Calculations
  getDayLeaderboard: (dayId: string) => DayStanding[];
  getFlightLeaderboard: (flightId: string) => FlightStanding[];
  getOverallLeaderboard: () => OverallStanding[];
}
```

---

### 3. Data Flow

```
User Action
    ↓
Component (UI layer)
    ↓
Context Action (TripContext/LeaderboardContext)
    ↓
State Update + localStorage Save
    ↓
Re-render Components
```

**Example - Adding a Score:**
1. User enters score in `GameScoreboardDialog.tsx`
2. Calls `updateMatchScore()` from `LeaderboardContext`
3. Updates `matchScores` state
4. Saves to localStorage key `golf-match-scores-{matchId}`
5. Leaderboard components re-render with new standings

---

## Scoring System Architecture

### Scoring Algorithms

**Location:** `src/lib/scoring.ts`

**Key Functions:**

```typescript
// Calculate Stableford points for a hole
function calculateStablefordPoints(
  strokes: number,
  par: number,
  strokeIndex: number,
  handicap: number
): number;

// Calculate net score with handicap
function calculateNetScore(
  grossScore: number,
  handicap: number,
  courseHandicap: number
): number;

// Determine match status (UP/DOWN/TIED)
function getMatchStatus(
  teamAScore: number,
  teamBScore: number,
  holesPlayed: number
): 'UP' | 'DOWN' | 'TIED';

// Calculate team score for different formats
function calculateTeamScore(
  format: GameFormat,
  playerScores: PlayerScore[]
): number;
```

### Game Format Support

**Singles (1v1):**
- Each player plays their own ball
- Lowest net score wins the hole
- Matchplay scoring (1-up, 2-up, etc.)

**Four-Ball (Better Ball):**
- Two teams of two players each
- Each player plays their own ball
- Best score per team per hole counts
- Match against opponent team's best ball

**High-Low:**
- Two teams of two players each
- Each hole has two matches: High handicapper vs High, Low vs Low
- Two points available per hole

**Texas Scramble:**
- Team format (2-4 players)
- All tee off, pick best shot
- All play from that spot
- Continue until holed

**Foursomes (Alternate Shot):**
- Partners alternate shots
- One ball per team
- Alternate tee shots per hole

**Chapman (Pinehurst):**
- Partners both tee off
- Switch balls for second shot
- Pick best ball, alternate from there

---

## Routing Architecture

### Route Structure

```typescript
// App.tsx routes
<BrowserRouter>
  <Routes>
    {/* Main entry - Leaderboard */}
    <Route path="/" element={<Leaderboard />} />
    
    {/* Player & Team Management */}
    <Route path="/players" element={<Players />} />
    
    {/* Fixture Scheduling */}
    <Route path="/fixtures" element={<Fixtures />} />
    
    {/* Active Game Scoring */}
    <Route path="/play" element={<Play />} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

### Navigation Structure

**Navigation Items:**
1. **Leaderboard** (`/`) - Main entry point
2. **Fixtures** (`/fixtures`) - Schedule & pairings
3. **Play** (`/play`) - Score entry
4. **Players** (`/players`) - Roster management

---

## Component Architecture

### Layout Components

**AppLayout.tsx**
- Provides consistent page structure
- Includes Navigation sidebar/header
- Main content area with padding
- Responsive design (mobile-friendly)

**Navigation.tsx**
- Vertical or horizontal nav depending on screen size
- Active route highlighting
- Icon + label for each nav item

### Page Components

Each page follows this pattern:
```typescript
function PageName() {
  // Get data from context
  const { players, teams } = useTripContext();
  
  // Local state for UI
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Handlers
  const handleAction = () => { ... };
  
  return (
    <AppLayout>
      <PageHeader title="Page Title" actions={...} />
      {/* Page content */}
    </AppLayout>
  );
}
```

---

## Data Persistence

### localStorage Strategy

All app data is persisted to localStorage for offline support:

| Key | Data Type | Description |
|-----|-----------|-------------|
| `golf-trip-players` | `Player[]` | Player roster |
| `golf-trip-teams` | `Team[]` | Team assignments |
| `golf-trip-fixture-days` | `FixtureDay[]` | Schedule |
| `golf-trip-games` | `Game[]` | Completed games |
| `golf-match-scores-{matchId}` | `MatchScore[]` | Per-match scores |
| `golf-match-setup-{matchId}` | `MatchSetup` | Match configuration |

### Data Loading

On app initialization:
1. Check localStorage for existing data
2. If found, load into TripContext state
3. If not found, start with empty/default state
4. Subscribe to state changes and save to localStorage

---

## Type System

### Core Types

**Player**
```typescript
interface Player {
  id: string;
  name: string;
  email?: string;
  handicap: number;
  teamId?: 'team-a' | 'team-b';
  isCaptain?: boolean;
}
```

**Team**
```typescript
interface Team {
  id: 'team-a' | 'team-b';
  name: string;
  players: Player[];
  captainId?: string;
}
```

**Game Format Types**
```typescript
type GameFormat = 
  | 'singles'
  | 'four-ball'
  | 'high-low'
  | 'texas-scramble'
  | 'foursomes'
  | 'chapman';

type ScoringType = 'stableford' | 'strokeplay' | 'matchplay';
```

**FixtureDay**
```typescript
interface FixtureDay {
  id: string;
  date: string;
  courseName: string;
  matches: Match[];
  isLocked: boolean;
}
```

---

## Performance Considerations

### Optimizations

1. **Memoization**
   - Use `useMemo` for expensive calculations (leaderboard standings)
   - Use `React.memo` for pure components

2. **Local Storage Batching**
   - Debounce saves to localStorage (not on every keystroke)
   - Batch multiple state updates

3. **Lazy Loading**
   - Route-based code splitting with React.lazy()
   - Load heavy components (maps) on demand

4. **Context Splitting**
   - Separate TripContext and LeaderboardContext
   - Prevents unnecessary re-renders

---

## Security Considerations

### Client-Side Only

The refactored app is entirely client-side:
- No server-side persistence required
- All data stored in localStorage
- No authentication needed for core functionality

### Data Validation

- TypeScript provides compile-time type safety
- Runtime validation on critical data entry
- Zod schemas for complex validation (forms)

---

## Future Considerations

### Potential Enhancements

1. **Backend Sync** (optional)
   - Add Supabase realtime sync
   - Multi-device support
   - Cloud backup

2. **Export Functionality**
   - Export leaderboard to PDF/Excel
   - Share results via link

3. **Historical Data**
   - Store previous trips
   - Player statistics over time

4. **Mobile App**
   - PWA support
   - Native mobile wrapper (Capacitor)

---

## Development Guidelines

### Adding New Features

1. **New Page:**
   - Create `src/pages/NewPage.tsx`
   - Add route to `App.tsx`
   - Add nav item to `Navigation.tsx`

2. **New Component:**
   - Add to appropriate folder under `src/components/`
   - Follow existing component patterns
   - Use shadcn/ui primitives

3. **New Game Format:**
   - Add format type to `GameFormat` union
   - Add scoring logic to `src/lib/scoring.ts`
   - Update UI components to support format

4. **State Changes:**
   - Add to appropriate context
   - Update localStorage keys if needed
   - Update TypeScript types
