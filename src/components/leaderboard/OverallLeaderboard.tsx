import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Trophy, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';

export function OverallLeaderboard() {
  const { getOverallLeaderboard, setSelectedDayId } = useLeaderboard();
  
  const overall = getOverallLeaderboard();
  
  const sortedTeams = [...overall.teamStandings].sort((a, b) => b.totalPoints - a.totalPoints);
  const leadingTeam = sortedTeams[0]?.totalPoints > sortedTeams[1]?.totalPoints ? sortedTeams[0] : null;
  
  return (
    <div className="space-y-4">
      {/* Winner Banner */}
      {overall.isWinnerDetermined && overall.winningTeamId && (
        <Card className="bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30">
          <CardContent className="py-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-accent" />
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              Winner Determined!
            </h2>
            <p className="text-lg" style={{ 
              color: sortedTeams.find(t => t.teamId === overall.winningTeamId)?.teamColor 
            }}>
              {sortedTeams.find(t => t.teamId === overall.winningTeamId)?.teamName} has clinched the victory!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The remaining matches cannot change the final outcome
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Team Standings */}
      <Card className="animate-fade-up">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Overall Standings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedTeams.map((team, idx) => {
            const isLeading = leadingTeam?.teamId === team.teamId;
            const isWinner = overall.isWinnerDetermined && overall.winningTeamId === team.teamId;
            
            return (
              <div 
                key={team.teamId}
                className={`p-4 rounded-lg transition-colors ${
                  isLeading ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-xl"
                    style={{ backgroundColor: team.teamColor }}
                  >
                    {team.totalPoints}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p 
                        className="font-semibold text-xl"
                        style={isLeading ? { color: team.teamColor } : {}}
                      >
                        {team.teamName}
                      </p>
                      {isWinner && (
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                      )}
                      {isLeading && !isWinner && (
                        <Badge variant="default" className="bg-primary">Leading</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>W: {team.matchesWon}</span>
                      <span>L: {team.matchesLost}</span>
                      <span>T: {team.matchesTied}</span>
                    </div>
                  </div>
                  
                  {/* Points Breakdown */}
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-muted-foreground">Previous:</span>
                      <span className="font-medium">{team.previousDaysPoints}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-medium text-primary">+{team.currentDayPoints}</span>
                    </div>
                    {team.potentialRemainingPoints > 0 && (
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground">Potential:</span>
                        <span className="font-medium text-accent">+{team.potentialRemainingPoints}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {!team.isWinningPossible && !isWinner && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                      Cannot mathematically win
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
      
      {/* Match Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-foreground">
                {overall.totalMatchesPlayed}
              </p>
              <p className="text-sm text-muted-foreground">Matches Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {overall.totalMatchesRemaining}
              </p>
              <p className="text-sm text-muted-foreground">Matches Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Day-by-Day Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Day-by-Day Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {overall.dayLeaderboards.map(day => {
              const dayTeams = [...day.teamStandings].sort((a, b) => b.totalPoints - a.totalPoints);
              const dayLeader = dayTeams[0]?.totalPoints > dayTeams[1]?.totalPoints ? dayTeams[0] : null;
              
              return (
                <AccordionItem key={day.fixtureDayId} value={day.fixtureDayId} className="border-none">
                  <AccordionTrigger 
                    className="hover:no-underline py-3 px-3 rounded-lg hover:bg-muted/30"
                    onClick={() => setSelectedDayId(day.fixtureDayId)}
                  >
                    <div className="flex items-center gap-3 w-full pr-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-sm text-primary">{day.dayNumber}</span>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium">{day.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {dayTeams.map(team => (
                          <div 
                            key={team.teamId}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              dayLeader?.teamId === team.teamId 
                                ? 'text-white' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                            style={dayLeader?.teamId === team.teamId ? { 
                              backgroundColor: team.teamColor 
                            } : {}}
                          >
                            {team.totalPoints}
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="grid gap-2 ml-11">
                      {day.flights.map(flight => (
                        <div 
                          key={flight.flightId}
                          className="flex items-center justify-between p-2 rounded bg-muted/20"
                        >
                          <span className="text-sm">Flight {flight.flightNumber}</span>
                          <div className="flex items-center gap-2">
                            {flight.matchResult.isComplete ? (
                              <Badge variant="secondary">
                                {flight.matchResult.winningTeamId === 'team-a' 
                                  ? dayTeams.find(t => t.teamId === 'team-a')?.teamName
                                  : flight.matchResult.winningTeamId === 'team-b'
                                  ? dayTeams.find(t => t.teamId === 'team-b')?.teamName
                                  : 'Tie'}
                              </Badge>
                            ) : (
                              <Badge variant="outline">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
          
          {overall.dayLeaderboards.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No fixture days finalized yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
