import { useState } from 'react';
import { useTrip } from '@/contexts/TripContext';
import { useLeaderboard } from '@/contexts/LeaderboardContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Trophy, TrendingUp } from 'lucide-react';
import { PlayerIdentification } from './PlayerIdentification';
import { DailyLeaderboard } from './DailyLeaderboard';
import { FlightLeaderboard } from './FlightLeaderboard';
import { OverallLeaderboard } from './OverallLeaderboard';

export function LeaderboardView() {
  const { fixtureDays } = useTrip();
  const { selectedDayId, setSelectedDayId } = useLeaderboard();
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'overall'>('daily');
  
  // Allow selecting any created fixture day; flights may be generated later once captains lock in.
  const availableDays = fixtureDays;
  
  const handleFlightClick = (flightId: string) => {
    setSelectedFlightId(flightId);
  };
  
  const handleBackFromFlight = () => {
    setSelectedFlightId(null);
  };
  
  return (
    <div className="space-y-4">
      {/* Player Identification */}
      <PlayerIdentification />
      
      {/* Day Selection */}
      {activeTab === 'daily' && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Select value={selectedDayId || ''} onValueChange={setSelectedDayId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select tournament day..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.length > 0 ? (
                    availableDays.map(fd => (
                      <SelectItem key={fd.id} value={fd.id}>
                        Day {fd.dayNumber} - {fd.courseName || new Date(fd.date).toLocaleDateString()}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_fixture_days__" disabled>
                      No fixture days created yet
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'overall')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Daily Leaderboard
          </TabsTrigger>
          <TabsTrigger value="overall" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overall Standings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="mt-0">
          {selectedFlightId ? (
            <FlightLeaderboard 
              flightId={selectedFlightId} 
              onBack={handleBackFromFlight} 
            />
          ) : (
            <DailyLeaderboard onFlightClick={handleFlightClick} />
          )}
        </TabsContent>
        
        <TabsContent value="overall" className="mt-0">
          <OverallLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
