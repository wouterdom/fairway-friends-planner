import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { TEAM_COLORS } from '@/lib/gameStatus';
import { motion } from 'framer-motion';

interface TeamStanding {
  teamId: 'team-a' | 'team-b';
  teamName: string;
  previousPoints: number;
  newPoints: number;
  change: number;
}

interface GameWonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winningTeamId: 'team-a' | 'team-b';
  winningTeamName: string;
  losingTeamName: string;
  winMargin: string; // e.g., "3&2" or "5 UP"
  teamStandings: TeamStanding[];
}

export function GameWonDialog({
  open,
  onOpenChange,
  winningTeamId,
  winningTeamName,
  losingTeamName,
  winMargin,
  teamStandings,
}: GameWonDialogProps) {
  const winningTeamColors = TEAM_COLORS[winningTeamId];
  const losingTeamId = winningTeamId === 'team-a' ? 'team-b' : 'team-a';
  const losingTeamColors = TEAM_COLORS[losingTeamId];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-2xl">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Game Complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            The match has been decided
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Winner announcement */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-xl text-center ${winningTeamColors.bgLight} border-2 ${winningTeamColors.border}`}
          >
            <p className="text-sm font-medium text-muted-foreground mb-2">Winner</p>
            <p className={`text-3xl font-bold ${winningTeamColors.textDark}`}>
              {winningTeamName}
            </p>
            <p className={`text-4xl font-black mt-2 ${winningTeamColors.textDark}`}>
              {winMargin}
            </p>
          </motion.div>

          {/* Overall standings update */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-center text-muted-foreground uppercase tracking-wide">
              Updated Overall Standings
            </p>
            
            <div className="space-y-2">
              {teamStandings.sort((a, b) => b.newPoints - a.newPoints).map((standing, index) => {
                const colors = TEAM_COLORS[standing.teamId];
                const isLeading = index === 0 && standing.newPoints !== teamStandings.find(s => s.teamId !== standing.teamId)?.newPoints;
                
                return (
                  <motion.div
                    key={standing.teamId}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${colors.border} ${colors.bgLighter}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.bg} text-white font-bold`}>
                        {index + 1}
                      </div>
                      <span className={`font-semibold ${colors.textDark}`}>{standing.teamName}</span>
                      {isLeading && (
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                          Leading
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{standing.newPoints}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                      {standing.change !== 0 && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                          standing.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {standing.change > 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold text-sm">
                            {standing.change > 0 ? '+' : ''}{standing.change}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={() => onOpenChange(false)} className="min-w-[120px]">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
