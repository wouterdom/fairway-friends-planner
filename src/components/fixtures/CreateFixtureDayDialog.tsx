import { useState } from 'react';
import { useTrip } from '@/contexts/TripContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FixtureDay, GameFormat, ScoringType } from '@/types/golf';
import { Calendar, MapPin, Trophy } from 'lucide-react';

interface CreateFixtureDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFixtureDayDialog({ open, onOpenChange }: CreateFixtureDayDialogProps) {
  const { fixtureDays, setFixtureDays, preferences } = useTrip();
  
  const [newFixture, setNewFixture] = useState({
    date: '',
    courseName: '',
    courseLocation: '',
    gameFormat: 'singles' as GameFormat,
    scoringType: 'stableford' as ScoringType,
  });

  const handleCreate = () => {
    if (!newFixture.date) return;

    const fixtureDay: FixtureDay = {
      id: `fd-${Date.now()}`,
      dayNumber: fixtureDays.length + 1,
      date: newFixture.date,
      gameFormat: newFixture.gameFormat,
      scoringType: newFixture.scoringType,
      courseName: newFixture.courseName || undefined,
      courseLocation: newFixture.courseLocation || undefined,
      matches: [],
      flights: [],
      teamALockedIn: false,
      teamBLockedIn: false,
      isFinalized: false,
    };

    setFixtureDays(prev => [...prev, fixtureDay]);
    setNewFixture({
      date: '',
      courseName: '',
      courseLocation: '',
      gameFormat: 'singles',
      scoringType: 'stableford',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Create Fixture Day
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newFixture.date}
              onChange={(e) => setNewFixture(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="courseName">Course Name (optional)</Label>
            <Input
              id="courseName"
              value={newFixture.courseName}
              onChange={(e) => setNewFixture(prev => ({ ...prev, courseName: e.target.value }))}
              placeholder="Royal Troon"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="courseLocation">Location (optional)</Label>
            <Input
              id="courseLocation"
              value={newFixture.courseLocation}
              onChange={(e) => setNewFixture(prev => ({ ...prev, courseLocation: e.target.value }))}
              placeholder="Scotland"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Game Format</Label>
            <Select
              value={newFixture.gameFormat}
              onValueChange={(value: GameFormat) => setNewFixture(prev => ({ ...prev, gameFormat: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singles">Singles (1v1)</SelectItem>
                <SelectItem value="fourball">Fourball (2v2 Best Ball)</SelectItem>
                <SelectItem value="foursomes">Foursomes (2v2 Alternate Shot)</SelectItem>
                <SelectItem value="texas-scramble">Texas Scramble (2v2)</SelectItem>
                <SelectItem value="chapman">Chapman (2v2)</SelectItem>
                <SelectItem value="high-low">High-Low (2v2)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Scoring Type</Label>
            <Select
              value={newFixture.scoringType}
              onValueChange={(value: ScoringType) => setNewFixture(prev => ({ ...prev, scoringType: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stableford">Stableford</SelectItem>
                <SelectItem value="strokeplay">Stroke Play</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleCreate} className="w-full" variant="hero">
            <Trophy className="w-4 h-4 mr-2" />
            Create Fixture Day
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
