import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Player } from '@/types/golf';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggablePlayerCardProps {
  player: Player;
  teamColor?: string;
  disabled?: boolean;
  isInPair?: boolean;
}

export function DraggablePlayerCard({ 
  player, 
  teamColor, 
  disabled = false,
  isInPair = false 
}: DraggablePlayerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: player.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg scale-105 z-50",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
        isInPair && "border-primary/50 bg-primary/5"
      )}
    >
      {!disabled && (
        <div {...attributes} {...listeners} className="touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: teamColor || 'hsl(var(--muted))', color: teamColor ? 'white' : undefined }}
      >
        {player.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{player.name}</p>
        <p className="text-xs text-muted-foreground">Handicap: {player.handicap}</p>
      </div>
    </div>
  );
}
