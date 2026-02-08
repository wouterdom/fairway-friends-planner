import { useState } from 'react';
import { useTrip } from '@/contexts/TripContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Palette, Check } from 'lucide-react';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function PlayerIdentification() {
  const { players, teams, fixtureDays } = useTrip();
  const { 
    currentPlayerIdentification, 
    setPlayerIdentification, 
    flightColor, 
    setFlightColor,
    selectedDayId,
  } = useLeaderboard();
  
  const [selectedPlayer, setSelectedPlayer] = useState<string>(
    currentPlayerIdentification?.playerId || ''
  );
  const [selectedFlight, setSelectedFlight] = useState<string>(
    currentPlayerIdentification?.flightId || ''
  );
  const [customColor, setCustomColor] = useState(flightColor);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  
  const selectedDay = fixtureDays.find(fd => fd.id === selectedDayId);
  
  const handleIdentify = () => {
    if (selectedPlayer && selectedFlight && selectedDayId) {
      setPlayerIdentification({
        playerId: selectedPlayer,
        flightId: selectedFlight,
        fixtureDayId: selectedDayId,
        flightColor,
      });
    }
  };
  
  const handleColorChange = (color: string) => {
    setCustomColor(color);
    setFlightColor(color);
    setColorDialogOpen(false);
  };
  
  const player = players.find(p => p.id === currentPlayerIdentification?.playerId);
  const team = teams.find(t => t.players.includes(currentPlayerIdentification?.playerId || ''));
  
  if (currentPlayerIdentification) {
    return (
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: flightColor }}
              >
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground">{player?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {team?.name} • Flight {currentPlayerIdentification.flightId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Palette className="w-4 h-4 mr-2" />
                    Color
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Choose Your Flight Color</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full transition-all ${
                            customColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(color)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label>Custom:</Label>
                      <Input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className="w-20 h-10 p-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => handleColorChange(customColor)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setPlayerIdentification(null as any)}
              >
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-5 h-5" />
          Identify Yourself
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select your name and flight to personalize the leaderboard view.
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Your Name</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Select player..." />
              </SelectTrigger>
              <SelectContent>
                {players.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="mb-2 block">Your Flight</Label>
            <Select
              value={selectedFlight}
              onValueChange={setSelectedFlight}
              disabled={!selectedDay}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedDay
                      ? 'Select a day first'
                      : (selectedDay.flights?.length ?? 0) === 0
                        ? 'No flights yet (captains must lock in)'
                        : 'Select flight...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {!selectedDay ? (
                  <SelectItem value="__no_day__" disabled>
                    Select a tournament day first
                  </SelectItem>
                ) : (selectedDay.flights?.length ?? 0) === 0 ? (
                  <SelectItem value="__no_flights__" disabled>
                    No flights created for this day yet
                  </SelectItem>
                ) : (
                  selectedDay.flights.map((flight, idx) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      Flight {idx + 1}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={handleIdentify}
          disabled={!selectedPlayer || !selectedFlight || !selectedDayId}
          className="w-full"
        >
          Identify & View Leaderboard
        </Button>
      </CardContent>
    </Card>
  );
}
