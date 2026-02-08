import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  UserPlus, 
  Users, 
  Mail, 
  Target,
  Pencil,
  Trash2,
  ChevronDown,
  Crown,
  ArrowRight,
  Info
} from 'lucide-react';
import { Player, Team } from '@/types/golf';
import { Link } from 'react-router-dom';

export default function Players() {
  const { players, addPlayer, teams, setTeams, updateTeamName, removePlayer, setCaptain } = useTrip();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<'team-a' | 'team-b' | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    handicap: 18,
  });
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({
    'team-a': true,
    'team-b': true,
    'unassigned': true,
  });

  const handleAddPlayer = () => {
    if (!newPlayer.name.trim()) return;

    const player: Player = {
      id: `p-${Date.now()}`,
      name: newPlayer.name.trim(),
      email: newPlayer.email.trim() || '',
      handicap: newPlayer.handicap,
    };

    addPlayer(player);
    setNewPlayer({ name: '', email: '', handicap: 18 });
    setDialogOpen(false);
  };

  const getPlayerTeam = (playerId: string): Team | undefined => {
    return teams.find(t => t.players.includes(playerId));
  };

  const assignToTeam = (playerId: string, teamId: string) => {
    if (teamId === 'none') {
      setTeams(prev => prev.map(t => ({
        ...t,
        players: t.players.filter(p => p !== playerId),
        captainId: t.captainId === playerId ? undefined : t.captainId,
      })));
    } else {
      setTeams(prev => prev.map(t => ({
        ...t,
        players: t.id === teamId 
          ? [...t.players.filter(p => p !== playerId), playerId]
          : t.players.filter(p => p !== playerId),
        captainId: t.captainId === playerId && t.id !== teamId ? undefined : t.captainId,
      })));
    }
  };

  const handleEditTeamName = (team: Team) => {
    setEditingTeam(team.id);
    setTeamNameInput(team.name);
  };

  const handleSaveTeamName = () => {
    if (editingTeam && teamNameInput.trim()) {
      updateTeamName(editingTeam, teamNameInput.trim());
    }
    setEditingTeam(null);
    setTeamNameInput('');
  };

  const toggleCaptain = (teamId: 'team-a' | 'team-b', playerId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team?.captainId === playerId) {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, captainId: undefined } : t));
    } else {
      setCaptain(teamId, playerId);
    }
  };

  const unassignedPlayers = players
    .filter(p => !getPlayerTeam(p.id))
    .sort((a, b) => a.handicap - b.handicap);
  
  const getTeamPlayers = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return [];
    return players
      .filter(p => team.players.includes(p.id))
      .sort((a, b) => a.handicap - b.handicap);
  };

  const toggleTeamOpen = (teamId: string) => {
    setOpenTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const renderPlayerCard = (player: Player, team?: Team) => {
    const isCaptain = team?.captainId === player.id;
    
    return (
      <Card 
        key={player.id}
        className="hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-fairway flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs sm:text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                {isCaptain && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-warning flex items-center justify-center">
                    <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-warning-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm truncate">{player.name}</h3>
                  {isCaptain && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs py-0 px-1 border-warning text-warning shrink-0">
                      Captain
                    </Badge>
                  )}
                </div>
                {player.email && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">{player.email}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => removePlayer(player.id)}
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm p-1.5 sm:p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-1 sm:gap-1.5 text-muted-foreground">
                <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Handicap</span>
              </div>
              <span className="font-semibold text-foreground text-base sm:text-lg">{player.handicap}</span>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Assign to Team</Label>
              <Select 
                value={team?.id || 'none'} 
                onValueChange={(value) => assignToTeam(player.id, value)}
              >
                <SelectTrigger className="w-full h-7 sm:h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-xs sm:text-sm">{t.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {team && (
              <Button
                variant={isCaptain ? "secondary" : "outline"}
                size="sm"
                className="w-full h-7 sm:h-8 text-[10px] sm:text-xs"
                onClick={() => toggleCaptain(team.id, player.id)}
              >
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">{isCaptain ? 'Remove as Captain' : 'Make Captain'}</span>
                <span className="sm:hidden">{isCaptain ? 'Remove' : 'Captain'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 md:mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
              Players & Teams
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage {players.length} players across {teams.length} teams
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="sm:h-10 sm:px-4" asChild>
              <Link to="/fixtures">
                <span className="hidden sm:inline">Next: Create Session</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm" className="sm:h-11 sm:px-6">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Player</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-lg sm:text-xl">Add New Player</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Full Name</Label>
                    <Input
                      id="name"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="handicap" className="text-sm">Handicap Index</Label>
                    <Input
                      id="handicap"
                      type="number"
                      min={0}
                      max={54}
                      step={0.1}
                      value={newPlayer.handicap}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, handicap: parseFloat(e.target.value) || 0 }))}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Player's current handicap index (0-54)
                    </p>
                  </div>
                  <Button onClick={handleAddPlayer} className="w-full" variant="hero">
                    Add Player
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Setup Guide */}
        <Card className="mb-4 sm:mb-6 border-primary/50 bg-primary/5 animate-fade-up">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">How Teams Work</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                  This is a <strong>team-based competition</strong> (like the Ryder Cup). 
                  Two teams compete across multiple golf days. 
                  Team names and colors can be customized by clicking the edit icon.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <Badge variant={players.length > 0 ? "default" : "outline"} className="text-[10px] sm:text-xs">1. Add Players</Badge>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Badge variant={players.filter(p => teams.some(t => t.players.includes(p.id))).length >= 4 ? "default" : "outline"} className="text-[10px] sm:text-xs">2. Assign to Teams</Badge>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Badge variant={teams.filter(t => t.captainId).length >= 2 ? "default" : "outline"} className="text-[10px] sm:text-xs">3. Set Captains</Badge>
                </div>
                {players.length > 0 && players.length < 4 && (
                  <p className="text-xs sm:text-sm text-warning mt-3 flex items-center gap-1">
                    <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                    Add at least {4 - players.length} more player{4 - players.length > 1 ? 's' : ''} to start playing
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {players.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Teams - Side by Side on tablet+, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {teams.map((team, index) => {
                const teamPlayers = getTeamPlayers(team.id);
                const captain = players.find(p => p.id === team.captainId);
                
                return (
                  <Collapsible
                    key={team.id}
                    open={openTeams[team.id]}
                    onOpenChange={() => toggleTeamOpen(team.id)}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Card className="h-fit">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="p-3 sm:p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <div 
                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                                style={{ backgroundColor: team.color }}
                              />
                              {editingTeam === team.id ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={teamNameInput}
                                    onChange={(e) => setTeamNameInput(e.target.value)}
                                    className="h-7 sm:h-8 w-28 sm:w-40 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveTeamName();
                                      if (e.key === 'Escape') setEditingTeam(null);
                                    }}
                                  />
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleSaveTeamName}>
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <CardTitle className="text-base sm:text-lg">{team.name}</CardTitle>
                              )}
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                {teamPlayers.length} players
                              </Badge>
                              {captain && (
                                <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-warning" />
                                  <span className="truncate max-w-[80px] sm:max-w-none">{captain.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              {editingTeam !== team.id && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTeamName(team);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              )}
                              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform ${openTeams[team.id] ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                          {teamPlayers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                              {teamPlayers.map(player => renderPlayerCard(player, team))}
                            </div>
                          ) : (
                            <div className="text-center py-4 sm:py-6 text-muted-foreground">
                              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs sm:text-sm">No players assigned yet</p>
                              <p className="text-[10px] sm:text-xs mt-1">Assign players from the unassigned section below</p>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>

            {/* Unassigned Players */}
            {unassignedPlayers.length > 0 && (
              <Collapsible
                open={openTeams['unassigned']}
                onOpenChange={() => toggleTeamOpen('unassigned')}
                className="animate-fade-up"
                style={{ animationDelay: `${teams.length * 0.1}s` }}
              >
                <Card className="border-dashed">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="p-3 sm:p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-base sm:text-lg text-muted-foreground">Unassigned Players</CardTitle>
                          <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">
                            {unassignedPlayers.length}
                          </Badge>
                        </div>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-transform ${openTeams['unassigned'] ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {unassignedPlayers.map(player => renderPlayerCard(player))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-30" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">No players yet</p>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">Add your first player to get started</p>
              <Button variant="hero" size="sm" className="sm:h-10" onClick={() => setDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
