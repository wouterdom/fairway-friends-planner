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
  const { players, addPlayer, teams, setTeams, updatePlayer, updateTeamName, removePlayer, setCaptain } = useTrip();
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
      // Remove from all teams
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

  // Group players by team and sort by handicap
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
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-fairway flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                {isCaptain && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-warning flex items-center justify-center">
                    <Crown className="w-3 h-3 text-warning-foreground" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm">{player.name}</h3>
                  {isCaptain && (
                    <Badge variant="outline" className="text-xs py-0 px-1.5 border-warning text-warning">
                      Captain
                    </Badge>
                  )}
                </div>
                {player.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{player.email}</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removePlayer(player.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="w-3.5 h-3.5" />
                <span>Handicap</span>
              </div>
              <span className="font-semibold text-foreground text-lg">{player.handicap}</span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Assign to Team</Label>
              <Select 
                value={team?.id || 'none'} 
                onValueChange={(value) => assignToTeam(player.id, value)}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
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
                className="w-full h-8 text-xs"
                onClick={() => toggleCaptain(team.id, player.id)}
              >
                <Crown className="w-3 h-3 mr-1.5" />
                {isCaptain ? 'Remove as Captain' : 'Make Captain'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Players & Teams
            </h1>
            <p className="text-muted-foreground">
              Manage {players.length} players across {teams.length} teams
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/fixtures">
                Next: Create Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Add New Player</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="handicap">Handicap Index</Label>
                    <Input
                      id="handicap"
                      type="number"
                      min={0}
                      max={54}
                      step={0.1}
                      value={newPlayer.handicap}
                      onChange={(e) => setNewPlayer(prev => ({ ...prev, handicap: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
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
        {players.length < 4 && (
          <Card className="mb-6 border-primary/50 bg-primary/5 animate-fade-up">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Getting Started</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    You need at least 4 players (2 per team) to create matches. 
                    Add players above and assign them to teams.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">Step 1: Add Players</Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">Step 2: Assign to Teams</Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">Step 3: Set Captains</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {players.length > 0 ? (
          <div className="space-y-4">
            {/* Teams - Side by Side */}
            <div className="grid md:grid-cols-2 gap-4">
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
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              {editingTeam === team.id ? (
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    value={teamNameInput}
                                    onChange={(e) => setTeamNameInput(e.target.value)}
                                    className="h-8 w-40"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveTeamName();
                                      if (e.key === 'Escape') setEditingTeam(null);
                                    }}
                                  />
                                  <Button size="sm" variant="ghost" onClick={handleSaveTeamName}>
                                    Save
                                  </Button>
                                </div>
                              ) : (
                                <CardTitle className="text-lg">{team.name}</CardTitle>
                              )}
                              <Badge variant="secondary">
                                {teamPlayers.length} players
                              </Badge>
                              {captain && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Crown className="w-3.5 h-3.5 text-warning" />
                                  <span>{captain.name}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {editingTeam !== team.id && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTeamName(team);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openTeams[team.id] ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {teamPlayers.length > 0 ? (
                            <div className="grid gap-3">
                              {teamPlayers.map(player => renderPlayerCard(player, team))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No players assigned yet</p>
                              <p className="text-xs mt-1">Assign players from the unassigned section below</p>
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
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-lg text-muted-foreground">Unassigned Players</CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {unassignedPlayers.length}
                          </Badge>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openTeams['unassigned'] ? 'rotate-180' : ''}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-foreground mb-2">No players yet</p>
              <p className="text-muted-foreground mb-6">Add your first player to get started</p>
              <Button variant="hero" onClick={() => setDialogOpen(true)}>
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
