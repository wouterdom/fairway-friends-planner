# Golf Competition Business Rules

## Overview

This app manages **Ryder Cup-style** team golf competitions between two teams over multiple sessions (days).

---

## Competition Structure

### Teams
- **2 Teams**: Team A vs Team B
- **6-12 players per team** (flexible)
- Each team has a **captain** who manages pairings
- Players assigned to teams at setup

### Sessions (Days)
- Multiple sessions across a trip
- Each session has:
  - Date
  - Course name
  - Game format
  - Scoring type
- Sessions are created and configured before play

---

## Game Formats Explained

### 1. Singles (1v1)
**What it is:** Individual match play, player vs player

**How it works:**
- 6 players per team = 6 separate matches
- Each match = 1 point
- Total points available: 6 per session

**Scoring:**
- Win = 1 point
- Tie = 0.5 points each
- Loss = 0 points

**Example:**
```
Session: Singles (Stableford)
Team A Player 1: 32 points → WINS → Team A: 1 point
Team B Player 1: 28 points

Team A Player 2: 30 points → TIES → Team A: 0.5, Team B: 0.5
Team B Player 2: 30 points

... (6 matches total)
```

---

### 2. Four-Ball (Better Ball - 2v2)
**What it is:** Partners play own ball, best score counts per team

**How it works:**
- 2 teams of 2 players each
- All 4 players play their own ball
- Team score = lowest net score of the 2 partners
- Compare team scores per hole

**Points:**
- Win match = 1 point
- 3 matches per session (6 players per team)
- Total points available: 3 per session

**Scoring Example:**
```
Hole 1 (Par 4):
Team A Player 1: Gross 5, Strokes 1, Net 4
Team A Player 2: Gross 4, Strokes 0, Net 4
Team A Best: 4

Team B Player 1: Gross 5, Strokes 1, Net 4
Team B Player 2: Gross 6, Strokes 1, Net 5
Team B Best: 4

Result: Hole Halved (4 vs 4)
```

---

### 3. High-Low (2v2)
**What it is:** Points awarded for both best and worst scores

**How it works:**
- 2 teams of 2 players
- Per hole:
  - Best score comparison = 2 points
  - Worst score comparison = 1 point
- Max 3 points per hole

**Points Distribution:**
```
Best Score (2 points):
- Team A best < Team B best → Team A: 2 pts
- Team B best < Team A best → Team B: 2 pts
- Tie → 1 point each

Worst Score (1 point):
- Team A worst < Team B worst → Team A: 1 pt
- Team B worst < Team A worst → Team B: 1 pt
- Tie → 0.5 point each
```

**Session Points:**
- 3 matches per session
- Match winner = 1 point (based on total hole points)
- Total points available: 3 per session

---

### 4. Foursomes (Alternate Shot - 2v2)
**What it is:** Partners play one ball, alternating shots

**How it works:**
- 2 teams of 2 players
- One ball per team
- Players alternate shots
- Alternate tee shots per hole
- Partners must decide strategy

**Points:**
- 3 matches per session
- 1 point per match
- Total points available: 3 per session

---

### 5. Texas Scramble (2v2 or 4v4)
**What it is:** Team plays one ball together

**How it works:**
- All players tee off
- Select best shot
- All players hit from that spot
- Continue until holed
- Fast-paced, team strategy

**Points:**
- 3 matches per session
- 1 point per match
- Total points available: 3 per session

---

### 6. Chapman (Pinehurst - 2v2)
**What it is:** Modified alternate shot

**How it works:**
- Both partners tee off
- Switch balls for second shot
- Select best ball after 2nd shot
- Alternate from there until holed
- Best of both worlds: individual play + team strategy

**Points:**
- 3 matches per session
- 1 point per match
- Total points available: 3 per session

---

## Scoring Types

### Stableford (Points)
**Goal:** Earn most points

**Points per hole:**
| Score | Points | Name |
|-------|--------|------|
| 2+ under par | 5 | Albatross or better |
| 1 under par | 3 | Birdie |
| Par | 2 | Par |
| 1 over par | 1 | Bogey |
| 2+ over par | 0 | Double bogey+ |

**Handicap Adjusted:**
- Player gets strokes on hardest holes
- Example: 12 handicap = 1 stroke on holes with SI 1-12
- 24 handicap = 2 strokes on SI 1-6, 1 stroke on SI 7-18

**Winning:**
- Higher total points = win
- Net Stableford after handicap

---

### Stroke Play
**Goal:** Lowest total strokes

**How it works:**
- Count every stroke
- Gross score = actual strokes
- Net score = gross - handicap strokes

**Handicap Adjusted:**
- Same stroke allocation as Stableford
- Compare net scores

**Winning:**
- Lower net score = win

---

### Match Play
**Goal:** Win most holes

**How it works:**
- Compare scores per hole
- Win hole = 1 up
- Lose hole = 1 down
- Tie hole = no change
- Final result expressed as "3&2" (3 up with 2 to play)

**Handicap:**
- Strokes given on hardest holes
- 10 handicap vs 20 handicap = 10 stroke difference
- Weaker player gets strokes on SI 1-10

**Winning:**
- Most holes won after 18 = win
- Can win before 18 if lead > holes remaining (e.g., 5 up with 4 to play)

---

## Match Flow

### 1. Setup Phase
- Create session
- Select format and scoring type
- Captains assign players to matches
- Lock in pairings

### 2. Pre-Play
- Select course
- Choose tees (yellow/white)
- Enter stroke table (SI per hole)
- Verify handicaps

### 3. During Play
- Enter scores hole-by-hole
- Real-time calculations
- Match status updates (UP/DOWN/TIED)
- Can pause/resume

### 4. Post-Play
- Validate all holes scored
- Calculate results
- Award points
- Update standings

---

## Overall Competition

### Tracking
- Each session contributes to total
- Running team point totals
- Individual player stats

### Winning
- Team with most points after all sessions wins
- Tie-breakers (if needed):
  1. Total matches won
  2. Head-to-head results
  3. Individual points leaders

---

## Example Competition

**Trip:** Scotland Golf Weekend  
**Teams:** Team Europe vs Team USA  
**Players:** 8 per team

### Session 1 (Friday): Four-Ball
- Format: Four-Ball
- Scoring: Stableford
- Matches: 4 (8 players)
- Points available: 4
- Result: Team Europe 3 - Team USA 1

### Session 2 (Saturday AM): Foursomes
- Format: Foursomes
- Scoring: Match Play
- Matches: 4
- Points available: 4
- Result: Team Europe 1 - Team USA 3

### Session 3 (Saturday PM): Singles
- Format: Singles
- Scoring: Stableford
- Matches: 8
- Points available: 8
- Result: Team Europe 4.5 - Team USA 3.5

### Session 4 (Sunday): Singles
- Format: Singles
- Scoring: Match Play
- Matches: 8
- Points available: 8
- Result: Team Europe 5 - Team USA 3

### Final Result
- **Team Europe: 13.5 points**
- Team USA: 10.5 points
- **Winner: Team Europe**

---

## Handicap System

### Course Handicap
```
Course Handicap = (Handicap Index × Slope Rating) / 113 + (Course Rating - Par)
```

### Playing Handicap
```
Playing Handicap = Course Handicap × Handicap Allowance
```

**Allowances by Format:**
- Singles: 100%
- Four-Ball: 90%
- Foursomes: 50% of combined
- Texas Scramble: 25% (4-player) or 35% (2-player)

### Strokes Per Hole
- Handicap 12 = 1 stroke on holes SI 1-12
- Handicap 24 = 2 strokes on SI 1-6, 1 stroke on SI 7-18
- Handicap 36 = 2 strokes on all holes

---

## Quick Reference

| Format | Players/Match | Matches/Session | Points/Match | Scoring Types |
|--------|---------------|-----------------|--------------|---------------|
| Singles | 1v1 | 6-8 | 1 | All |
| Four-Ball | 2v2 | 3-4 | 1 | All |
| High-Low | 2v2 | 3-4 | 1 | All |
| Foursomes | 2v2 | 3-4 | 1 | Stroke/Match |
| Texas Scramble | 2v2 or 4v4 | 3-4 | 1 | Stableford/Stroke |
| Chapman | 2v2 | 3-4 | 1 | All |

**Total Points per Session:**
- Singles: 6-8 points
- Pairs formats: 3-4 points
