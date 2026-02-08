import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';

interface FlightLeaderboardProps {
  flightId: string;
  onBack: () => void;
}

export function FlightLeaderboard({ flightId, onBack }: FlightLeaderboardProps) {
  const { 
    selectedDayId, 
    getFlightLeaderboard,
    currentPlayerIdentification,
    flightColor,
  } = useLeaderboard();
  
  const flightLeaderboard = selectedDayId 
    ? getFlightLeaderboard(flightId, selectedDayId) 
    : null;
  
  if (!flightLeaderboard) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Flight not found</p>
          <Button variant="ghost" onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leaderboard
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  const { matchResult, players } = flightLeaderboard;
  const isMyFlight = currentPlayerIdentification?.flightId === flightId;
  
  // Group players by team
  const teamAPlayers = players.filter(p => p.teamId === 'team-a');
  const teamBPlayers = players.filter(p => p.teamId === 'team-b');
  
  const renderPlayerCard = (player: typeof players[0]) => {
    const isCurrentPlayer = currentPlayerIdentification?.playerId === player.playerId;
    
    return (
      <div
        key={player.playerId}
        className={`p-4 rounded-lg ${
          isCurrentPlayer 
            ? 'border-2' 
            : 'bg-muted/30'
        }`}
        style={isCurrentPlayer ? { 
          borderColor: flightColor,
          backgroundColor: `${flightColor}10`,
        } : {}}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-foreground">{player.playerName}</p>
            {isCurrentPlayer && (
              <Badge 
                variant="secondary" 
                className="text-xs mt-1"
                style={{ backgroundColor: `${flightColor}20`, color: flightColor }}
              >
                You
              </Badge>
            )}
          </div>
          <Badge variant={player.isCurrentlyPlaying ? "default" : "secondary"}>
            {player.isCurrentlyPlaying ? 'Playing' : `Thru ${player.thruHole}`}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded bg-background">
            <p className="text-2xl font-bold text-foreground">{player.grossScore}</p>
            <p className="text-xs text-muted-foreground">Gross</p>
          </div>
          <div className="text-center p-3 rounded bg-background">
            <p className="text-2xl font-bold text-primary">{player.netScore}</p>
            <p className="text-xs text-muted-foreground">Net</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="font-display text-lg font-semibold">
            Flight {flightLeaderboard.flightNumber}
          </h2>
          {isMyFlight && (
            <Badge 
              style={{ backgroundColor: `${flightColor}20`, color: flightColor }}
            >
              Your Flight
            </Badge>
          )}
        </div>
      </div>
      
      {/* Match Status */}
      <Card className={`${
        matchResult.isComplete ? 'border-primary/30' : 'border-warning/30'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <div 
              className={`text-center ${matchResult.winningTeamId === 'team-a' ? 'font-bold' : ''}`}
            >
              <p className="text-lg">Team A</p>
              <p className="text-2xl font-bold">{matchResult.teamAPoints}</p>
            </div>
            <div className="text-center px-6">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {matchResult.isComplete ? 'Final' : 'In Progress'}
              </p>
              <p className="text-lg font-bold text-muted-foreground">VS</p>
            </div>
            <div 
              className={`text-center ${matchResult.winningTeamId === 'team-b' ? 'font-bold' : ''}`}
            >
              <p className="text-lg">Team B</p>
              <p className="text-2xl font-bold">{matchResult.teamBPoints}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Players Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Team A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamAPlayers.map(renderPlayerCard)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Team B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamBPlayers.map(renderPlayerCard)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
