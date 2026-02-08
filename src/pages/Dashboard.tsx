import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Calendar,
  MapPin,
  TrendingUp,
  ArrowRight,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { preferences, players, games, teams } = useTrip();

  const totalPaid = players.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalOwed = players.reduce((sum, p) => sum + p.amountOwed, 0);
  const paymentProgress = totalPaid / (totalPaid + totalOwed) * 100;

  const completedGames = games.filter(g => g.completed).length;
  const inProgressGames = games.filter(g => !g.completed).length;

  // Calculate leaderboard
  const leaderboard = players
    .map(player => {
      const totalScore = games.reduce((sum, game) => {
        const scores = game.scores[player.id];
        return scores ? sum + scores.reduce((a, b) => a + b, 0) : sum;
      }, 0);
      const gamesPlayed = games.filter(g => g.scores[player.id]).length;
      return { ...player, totalScore, gamesPlayed };
    })
    .filter(p => p.gamesPlayed > 0)
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, 5);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                {preferences?.tripName || 'Your Golf Trip'}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{preferences?.destination}</span>
                <span className="mx-2">•</span>
                <Calendar className="w-4 h-4" />
                <span>{preferences?.startDate} - {preferences?.endDate}</span>
              </div>
            </div>
            <Button variant="mint" size="lg" asChild>
              <Link to="/fixtures">
                <Trophy className="w-5 h-5 mr-2" />
                View Fixtures
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Players</p>
                  <p className="text-3xl font-bold text-foreground">{players.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Teams</p>
                  <p className="text-3xl font-bold text-foreground">{teams.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Games</p>
                  <p className="text-3xl font-bold text-foreground">{completedGames}</p>
                  {inProgressGames > 0 && (
                    <p className="text-xs text-primary">{inProgressGames} in progress</p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Collected</p>
                  <p className="text-3xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <Card className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display text-xl">Leaderboard</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/fixtures">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-accent text-accent-foreground' :
                        index === 1 ? 'bg-muted-foreground/20 text-foreground' :
                        index === 2 ? 'bg-warning/20 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {player.gamesPlayed} game{player.gamesPlayed > 1 ? 's' : ''} played
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{player.totalScore}</p>
                        <p className="text-xs text-muted-foreground">total strokes</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : inProgressGames > 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 text-primary opacity-70" />
                  <p className="font-medium text-primary">{inProgressGames} game{inProgressGames > 1 ? 's' : ''} in progress</p>
                  <p className="text-sm">Scores will appear when games are completed</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No games completed yet</p>
                  <p className="text-sm">Start a game to see the leaderboard</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <CardHeader>
              <CardTitle className="font-display text-xl">Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{Math.round(paymentProgress)}%</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-gradient-fairway rounded-full transition-all duration-500"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Collected</span>
                  <span className="text-lg font-semibold text-success">${totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className="text-lg font-semibold text-warning">${totalOwed.toLocaleString()}</span>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="text-xl font-bold text-foreground">${(totalPaid + totalOwed).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-6" asChild>
                <Link to="/financials">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Financials
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        {preferences?.courses && preferences.courses.length > 0 && (
          <Card className="mt-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="font-display text-xl">Scheduled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {preferences.courses.map((course, index) => (
                  <div
                    key={course}
                    className="p-4 rounded-lg bg-gradient-to-br from-muted to-secondary/50 border border-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-fairway flex items-center justify-center shrink-0">
                        <span className="text-primary-foreground font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{course}</p>
                        <p className="text-sm text-muted-foreground">Day {index + 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
