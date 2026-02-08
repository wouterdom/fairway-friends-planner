import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Player } from '@/types/golf';
import { DraggablePlayerCard } from './DraggablePlayerCard';
import { cn } from '@/lib/utils';

interface PlayerDropZoneProps {
  id: string;
  title: string;
  players: Player[];
  teamColor?: string;
  disabled?: boolean;
  maxPlayers?: number;
  emptyMessage?: string;
}

export function PlayerDropZone({
  id,
  title,
  players,
  teamColor,
  disabled = false,
  maxPlayers,
  emptyMessage = "Drag players here"
}: PlayerDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-4 rounded-lg border-2 border-dashed transition-colors min-h-[120px]",
        isOver && !disabled ? "border-primary bg-primary/5" : "border-border",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground">{title}</h4>
        {maxPlayers && (
          <span className="text-xs text-muted-foreground">
            {players.length}/{maxPlayers}
          </span>
        )}
      </div>
      
      <SortableContext items={players.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {players.length > 0 ? (
            players.map(player => (
              <DraggablePlayerCard
                key={player.id}
                player={player}
                teamColor={teamColor}
                disabled={disabled}
              />
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {emptyMessage}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
