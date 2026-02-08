import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Menu,
  X,
  CircleDot,
  Play,
  CheckCircle2
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTrip } from '@/contexts/TripContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/players', label: 'Players', icon: Users },
  { path: '/fixtures', label: 'Sessions', icon: Trophy },
  { path: '/play', label: 'Play', icon: Play },
];

export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { players, fixtureDays } = useTrip();

  // Check if setup is complete
  const hasEnoughPlayers = players.length >= 4;
  const hasSessions = fixtureDays.length > 0;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col bg-card border-r border-border z-50">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-mint">
              <CircleDot className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg font-semibold text-foreground">Fairway Friends</h1>
              <p className="text-xs text-muted-foreground">Golf Leaderboard</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 py-6">
          {/* Progress Indicator */}
          <div className="px-4 mb-6">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Setup Progress</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${players.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className={players.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    Add Players
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${hasEnoughPlayers ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className={hasEnoughPlayers ? 'text-foreground' : 'text-muted-foreground'}>
                    Assign Teams
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${hasSessions ? 'text-success' : 'text-muted-foreground'}`} />
                  <span className={hasSessions ? 'text-foreground' : 'text-muted-foreground'}>
                    Create Sessions
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-mint'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-4 border-t border-border">
          <div className="p-4 rounded-xl bg-secondary">
            <p className="text-xs text-muted-foreground mb-2">Quick Tips</p>
            <p className="text-xs text-foreground">
              {players.length === 0 
                ? "Start by adding players to your competition"
                : !hasEnoughPlayers 
                ? "Assign at least 2 players to each team"
                : !hasSessions
                ? "Create a session to start playing"
                : "You're ready to play! Head to the Play tab"
              }
            </p>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-mint">
            <CircleDot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-foreground">Fairway Friends</span>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-16 left-0 right-0 bg-card border-b border-border shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Progress */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Setup Progress</p>
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${players.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                  <span>Players</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${hasEnoughPlayers ? 'text-success' : 'text-muted-foreground'}`} />
                  <span>Teams</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CheckCircle2 className={`w-4 h-4 ${hasSessions ? 'text-success' : 'text-muted-foreground'}`} />
                  <span>Sessions</span>
                </div>
              </div>
            </div>

            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
