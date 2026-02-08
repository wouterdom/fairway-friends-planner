import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, File, X, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { Match, GameFormat, ScoringType } from '@/types/golf';
import { StrokeTableData } from './GameScoreboardDialog';

interface DisplayMatch extends Match {
  fixtureDayId: string;
  fixtureDayNumber: number;
  courseName: string;
  gameFormat: GameFormat;
  scoringType?: ScoringType;
}

interface GameSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: DisplayMatch;
  onStartGame: (teeColor: 'yellow' | 'white', strokeTableData?: StrokeTableData) => void;
}

const STORAGE_KEY_PREFIX = 'golf-match-setup-';

export function GameSetupDialog({ open, onOpenChange, match, onStartGame }: GameSetupDialogProps) {
  const [teeColor, setTeeColor] = useState<'yellow' | 'white'>('yellow');
  const [strokeTableFile, setStrokeTableFile] = useState<File | null>(null);
  const [strokeTableData, setStrokeTableData] = useState<StrokeTableData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF, Word document, or image file');
      return;
    }

    setIsProcessing(true);
    setStrokeTableFile(file);

    // For now, we store the file info - in a full implementation, 
    // you would parse the document to extract course rating, slope rating, etc.
    try {
      const data: StrokeTableData = {
        fileName: file.name,
        fileType: file.type || fileExtension,
      };
      
      setStrokeTableData(data);
      toast.success('Stroke table uploaded successfully');
    } catch (error) {
      toast.error('Failed to process stroke table');
      console.error('Error processing stroke table:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeStrokeTable = () => {
    setStrokeTableFile(null);
    setStrokeTableData(null);
  };

  const handleStartGame = () => {
    // Save setup to localStorage
    const setupData = {
      teeColor,
      strokeTableData,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${match.id}`, JSON.stringify(setupData));
    
    onStartGame(teeColor, strokeTableData || undefined);
    onOpenChange(false);
  };

  const getFileIcon = () => {
    if (!strokeTableFile) return <Upload className="w-6 h-6" />;
    if (strokeTableFile.type.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
    if (strokeTableFile.type.includes('image')) return <Image className="w-6 h-6 text-blue-500" />;
    return <File className="w-6 h-6 text-blue-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Circle className="w-5 h-5 text-primary" />
            Game Setup
          </DialogTitle>
          <DialogDescription>
            Configure tee color and upload stroke table for {match.courseName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tee Color Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tee Color</Label>
            <p className="text-sm text-muted-foreground">
              Select the tee color for the entire flight
            </p>
            <RadioGroup 
              value={teeColor} 
              onValueChange={(value) => setTeeColor(value as 'yellow' | 'white')}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="yellow"
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  teeColor === 'yellow' 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' 
                    : 'border-muted hover:border-yellow-300'
                }`}
              >
                <RadioGroupItem value="yellow" id="yellow" className="sr-only" />
                <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-600" />
                <span className="font-medium">Yellow Tees</span>
              </Label>
              <Label
                htmlFor="white"
                className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  teeColor === 'white' 
                    ? 'border-gray-400 bg-gray-50 dark:bg-gray-500/10' 
                    : 'border-muted hover:border-gray-300'
                }`}
              >
                <RadioGroupItem value="white" id="white" className="sr-only" />
                <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-400" />
                <span className="font-medium">White Tees</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Stroke Table Upload */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Stroke Table (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Upload the course stroke table for accurate handicap calculations
            </p>
            
            {strokeTableFile ? (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon()}
                    <div>
                      <p className="font-medium text-sm">{strokeTableFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(strokeTableFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={removeStrokeTable}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {strokeTableData && (
                  <div className="mt-3 pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      Stroke table loaded
                    </Badge>
                  </div>
                )}
              </Card>
            ) : (
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
                  isProcessing ? 'bg-muted/50' : 'hover:border-primary/50 hover:bg-muted/30'
                }`}>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {isProcessing ? 'Processing...' : 'Click to upload stroke table'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, JPEG, PNG supported
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartGame} className="gap-2">
            Start Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
