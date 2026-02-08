import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Player } from '@/types/golf';
import { DraggablePlayerCard } from './DraggablePlayerCard';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface PairingZoneProps {
  id: string;
  pairIndex: number;
  players: Player[];
  teamColor?: string;
  disabled?: boolean;
}

export function PairingZone({
  id,
  pairIndex,
  players,
  teamColor,
  disabled = false,
}: PairingZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-3 rounded-lg border-2 border-dashed transition-colors",
        isOver && !disabled ? "border-primary bg-primary/5" : "border-border",
        players.length === 2 && "border-solid border-primary/30 bg-primary/5",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Pair {pairIndex + 1}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {players.length}/2
        </span>
      </div>
      
      <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[80px]">
          {players.length > 0 ? (
            players.map(player => (
              <DraggablePlayerCard
                key={player.id}
                player={player}
                teamColor={teamColor}
                disabled={disabled}
                isInPair
              />
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground text-xs">
              Drop 2 players
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
