import { useTrip } from '@/contexts/TripContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trophy, Users, User, ChevronRight } from 'lucide-react';
import { IndividualLeaderboardEntry, TeamLeaderboardEntry } from '@/types/golf';

interface DailyLeaderboardProps {
  onFlightClick?: (flightId: string) => void;
}

export function DailyLeaderboard({ onFlightClick }: DailyLeaderboardProps) {
  const { players } = useTrip();
  const { 
    selectedDayId, 
    getDayLeaderboard, 
    viewMode, 
    setViewMode,
    currentPlayerIdentification,
    flightColor,
  } = useLeaderboard();
  
  const dayLeaderboard = selectedDayId ? getDayLeaderboard(selectedDayId) : null;
  
  if (!dayLeaderboard) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-lg font-medium text-foreground mb-2">No Day Selected</p>
          <p className="text-sm text-muted-foreground">
            Select a tournament day to view the leaderboard
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const renderTeamRow = (team: TeamLeaderboardEntry, otherTeam: TeamLeaderboardEntry | undefined) => {
    const diff = team.totalPoints - (otherTeam?.totalPoints || 0);
    const status = diff > 0 ? `${diff} UP` : diff < 0 ? `${Math.abs(diff)} DOWN` : 'TIED';
    const isLeading = diff > 0;
    const winningStyle = isLeading ? { color: team.teamColor } : {};
    
    return (
      <div 
        key={team.teamId}
        className={`flex items-center gap-4 p-4 rounded-lg ${
          isLeading ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
        } transition-colors`}
      >
        <div 
          className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xs ${
            diff > 0 ? 'bg-green-600' : diff < 0 ? 'bg-red-500' : ''
          }`}
          style={diff === 0 ? { backgroundColor: team.teamColor } : {}}
        >
          {status}
        </div>
        <div className="flex-1">
          <p 
            className="font-semibold text-lg"
            style={winningStyle}
          >
            {team.teamName}
          </p>
          <p className="text-sm text-muted-foreground">
            W: {team.matchesWon} • L: {team.matchesLost} • T: {team.matchesTied}
          </p>
        </div>
        {isLeading && (
          <Badge variant="default" className="bg-primary">Leading</Badge>
        )}
      </div>
    );
  };
  
  const renderPlayerRow = (entry: IndividualLeaderboardEntry, rank: number) => {
    const isCurrentPlayer = currentPlayerIdentification?.playerId === entry.playerId;
    const team = dayLeaderboard.teamStandings.find(t => t.teamId === entry.teamId);
    
    return (
      <div 
        key={entry.playerId}
        className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
          isCurrentPlayer 
            ? 'border-2' 
            : 'bg-muted/30 hover:bg-muted/50'
        }`}
        style={isCurrentPlayer ? { 
          borderColor: flightColor,
          backgroundColor: `${flightColor}10`,
        } : {}}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank === 1 ? 'bg-accent text-accent-foreground' :
          rank === 2 ? 'bg-muted-foreground/30 text-foreground' :
          rank === 3 ? 'bg-warning/30 text-warning' :
          'bg-muted text-muted-foreground'
        }`}>
          {rank}
        </div>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: team?.teamColor }}
        />
        <div className="flex-1">
          <p className="font-medium text-foreground">{entry.playerName}</p>
          <p className="text-xs text-muted-foreground">
            {entry.isCurrentlyPlaying ? 'Playing' : `Thru ${entry.thruHole}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-foreground">{entry.netScore}</p>
          <p className="text-xs text-muted-foreground">Net</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-muted-foreground">{entry.grossScore}</p>
          <p className="text-xs text-muted-foreground">Gross</p>
        </div>
      </div>
    );
  };
  
  const sortedTeams = [...dayLeaderboard.teamStandings].sort((a, b) => b.totalPoints - a.totalPoints);
  
  return (
    <Card className="animate-fade-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            {dayLeaderboard.courseName}
          </CardTitle>
          <Badge variant="secondary">
            Day {dayLeaderboard.dayNumber}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(dayLeaderboard.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })} • {dayLeaderboard.gameFormat.replace('-', ' ')}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'team' | 'individual')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team vs Team
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Individual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="space-y-3 mt-0">
            {sortedTeams.map((team, idx) => renderTeamRow(team, sortedTeams[idx === 0 ? 1 : 0]))}
            
            {/* Flight breakdown */}
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="flights" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">View by Flight</span>
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <div className="space-y-2">
                    {dayLeaderboard.flights.map(flight => {
                      const isMyFlight = currentPlayerIdentification?.flightId === flight.flightId;
                      const result = flight.matchResult;
                      const teamA = dayLeaderboard.teamStandings.find(t => t.teamId === 'team-a');
                      const teamB = dayLeaderboard.teamStandings.find(t => t.teamId === 'team-b');
                      
                      return (
                        <div
                          key={flight.flightId}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            isMyFlight 
                              ? 'border-2' 
                              : 'bg-muted/20 hover:bg-muted/40 border border-transparent'
                          }`}
                          style={isMyFlight ? { 
                            borderColor: flightColor,
                            backgroundColor: `${flightColor}10`,
                          } : {}}
                          onClick={() => onFlightClick?.(flight.flightId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Flight {flight.flightNumber}</span>
                              {isMyFlight && (
                                <Badge 
                                  variant="secondary" 
                                  style={{ backgroundColor: `${flightColor}20`, color: flightColor }}
                                >
                                  Your Flight
                                </Badge>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span 
                              className={result.winningTeamId === 'team-a' ? 'font-bold' : ''}
                              style={result.winningTeamId === 'team-a' ? { color: teamA?.teamColor } : {}}
                            >
                              {teamA?.teamName}
                            </span>
                            <span className="text-muted-foreground">vs</span>
                            <span 
                              className={result.winningTeamId === 'team-b' ? 'font-bold' : ''}
                              style={result.winningTeamId === 'team-b' ? { color: teamB?.teamColor } : {}}
                            >
                              {teamB?.teamName}
                            </span>
                            {result.isComplete ? (
                              <Badge variant="secondary" className="ml-auto">Complete</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-auto">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          
          <TabsContent value="individual" className="space-y-2 mt-0">
            {dayLeaderboard.individualStandings.map((entry, idx) => 
              renderPlayerRow(entry, idx + 1)
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
