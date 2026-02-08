# Fairway Friends - Golf Leaderboard & Scoring App

A modern web application for tracking golf competitions between friends. Supports both casual quick games and organized Ryder Cup-style competitions.

![Golf Leaderboard](https://img.shields.io/badge/Golf-Leaderboard-green)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

## 🎯 Features

### Two Game Modes

**⚡ Quick Play** - Start playing immediately
- No setup required
- Choose format and scoring
- Perfect for casual rounds

**🏆 Organized Competition** - Full Ryder Cup experience  
- Team-based competition
- Captain pairing system
- Multiple golf days
- Structured match play

### Supported Formats
- **Singles** - 1v1 match play
- **Four-Ball** - Better ball (2v2)
- **High-Low** - Points per hole (2v2)
- **Foursomes** - Alternate shot (2v2)
- **Texas Scramble** - Team scramble
- **Chapman** - Pinehurst format

### Scoring Types
- **Stableford** - Points-based
- **Stroke Play** - Total strokes
- **Match Play** - Hole-by-hole

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/wouterdom/fairway-friends-planner.git

# Navigate to project
cd fairway-friends-planner

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:8080
```

### Just Play (No Setup)
1. Open the app
2. Click "Quick Play" 
3. Select format and scoring
4. Start playing immediately!

### Full Competition Setup
1. **Dashboard** - Follow the 6-step checklist
2. **Players** - Add players, assign to teams, set captains
3. **Sessions** - Create Golf Days
4. **Play** - Start organized games

## 📱 Mobile Friendly

Fully responsive design works on:
- iPhone / iPad
- Android phones & tablets
- Desktop browsers

## 🛠️ Tech Stack

- **Frontend:** React 18.3 + TypeScript 5.8
- **Build Tool:** Vite 5.4
- **Styling:** Tailwind CSS 3.4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **State:** React Context + localStorage

## 📁 Project Structure

```
src/
├── pages/
│   ├── Dashboard.tsx      # Setup checklist & stats
│   ├── Players.tsx        # Player & team management
│   ├── Fixtures.tsx       # Golf Days (Sessions)
│   └── Play.tsx           # Quick Play + Organized
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx # Mobile/desktop nav
│   │   └── AppLayout.tsx  # Page wrapper
│   ├── ui/                # shadcn components
│   ├── fixtures/          # Pairing management
│   ├── leaderboard/       # Stats display
│   └── play/              # Score entry
├── contexts/
│   ├── TripContext.tsx    # Main app state
│   └── LeaderboardContext.tsx
├── lib/
│   ├── scoring.ts         # Golf scoring logic
│   └── utils.ts
└── types/
    └── golf.ts            # TypeScript types
```

## 📊 Data Model

The app uses localStorage for persistence:

- **Players** - Name, email, handicap
- **Teams** - Two teams with players and captains
- **Golf Days** - Date, course, format, matches
- **Games** - Scores and completion status

## 🎮 How It Works

### User Flow

```
Dashboard (Setup Checklist)
    ↓
Players (Add & Assign)
    ↓
Sessions (Create Golf Days)
    ↓
Captains Set Pairings
    ↓
Both Lock In
    ↓
Play (Score Matches)
    ↓
Leaderboard (Results)
```

### Quick Play Flow
```
Dashboard → Quick Play → Select Format → Play!
```

## 📝 Documentation

See `/docs/` folder for detailed documentation:

- **STATUS.md** - Current state and features
- **business-rules.md** - Golf competition rules
- **improvement-plan.md** - Development roadmap
- **architecture.md** - Technical details

## 🐛 Known Limitations

- Data stored only in browser (localStorage)
- No multi-device sync (each browser is separate)
- No user accounts
- No backend (yet)

## 🔮 Future Enhancements

Potential improvements:
- [ ] PocketBase backend for sync
- [ ] User authentication
- [ ] Export results (PDF/Excel)
- [ ] Historical stats
- [ ] Push notifications
- [ ] PWA support

## 🤝 Contributing

This project was built with the help of Claude AI assistant.

## 📄 License

MIT License - Feel free to use and modify!

## 🏆 Credits

Built for golf lovers who want to track competitions with friends!

---

**Ready to play?** `npm run dev` and hit the links! ⛳
