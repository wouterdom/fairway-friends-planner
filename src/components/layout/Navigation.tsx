import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import React from 'react';
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
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, shortLabel: 'Home' },
  { path: '/players', label: 'Players', icon: Users, shortLabel: 'Players' },
  { path: '/fixtures', label: 'Sessions', icon: Trophy, shortLabel: 'Days' },
  { path: '/play', label: 'Play', icon: Play, shortLabel: 'Play' },
];

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { players, fixtureDays } = useTrip();

  // Check if setup is complete
  const hasEnoughPlayers = players.length >= 4;
  const hasSessions = fixtureDays.length > 0;

  return (
    <>
      {/* Desktop Navigation - Sidebar */}
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

      {/* Mobile Navigation - Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-50 px-2 flex items-center justify-around safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-lg mb-0.5',
                isActive ? 'bg-primary/10' : ''
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium">
                {window.innerWidth < 380 ? item.shortLabel : item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <CircleDot className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-foreground text-sm">Fairway Friends</span>
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-sm pt-14"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Progress */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">Setup Progress</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      players.length > 0 ? 'bg-success/20' : 'bg-muted'
                    )}>
                      <CheckCircle2 className={cn(
                        'w-4 h-4',
                        players.length > 0 ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm',
                      players.length > 0 ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      Add Players ({players.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      hasEnoughPlayers ? 'bg-success/20' : 'bg-muted'
                    )}>
                      <CheckCircle2 className={cn(
                        'w-4 h-4',
                        hasEnoughPlayers ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm',
                      hasEnoughPlayers ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      Assign Teams
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      hasSessions ? 'bg-success/20' : 'bg-muted'
                    )}>
                      <CheckCircle2 className={cn(
                        'w-4 h-4',
                        hasSessions ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>
                    <span className={cn(
                      'text-sm',
                      hasSessions ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      Create Sessions ({fixtureDays.length})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Tips */}
            <div className="p-4 rounded-xl bg-secondary">
              <p className="text-xs text-muted-foreground mb-2">Quick Tips</p>
              <p className="text-sm text-foreground">
                {players.length === 0 
                  ? "Start by adding players to your competition"
                  : !hasEnoughPlayers 
                  ? "Assign at least 2 players to each team"
                  : !hasSessions
                  ? "Create a session to start playing"
                  : "You're ready to play! Tap the Play tab below"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Spacer for bottom nav */}
      <div className="md:hidden h-16" />
    </>
  );
}

// Simple Card component for mobile menu
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}>
      {children}
    </div>
  );
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
