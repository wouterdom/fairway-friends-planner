import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TripSuggestion, TripPreferences } from '@/types/golf';
import { MapPin, Star, DollarSign, ChevronLeft, RefreshCw, Sparkles } from 'lucide-react';

interface TripSuggestionsProps {
  suggestions: TripSuggestion[];
  preferences: Partial<TripPreferences>;
  onSelect: (suggestion: TripSuggestion) => void;
  onBack: () => void;
  onRegenerate: () => void;
}

const TripSuggestions: React.FC<TripSuggestionsProps> = ({
  suggestions,
  preferences,
  onSelect,
  onBack,
  onRegenerate,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
          <Sparkles className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Your Trip Options</h2>
        <p className="text-muted-foreground mt-2">
          Based on your preferences, here are our top recommendations
        </p>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/50 group"
              onClick={() => onSelect(suggestion)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                      {suggestion.name}
                    </h3>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{suggestion.destination}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${suggestion.estimatedCostPerPerson}/person
                  </Badge>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {suggestion.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestion.highlights.slice(0, 4).map((highlight, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-1 text-accent" />
                    {suggestion.courses.length} courses • {suggestion.bestTimeToVisit}
                  </div>
                  <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    Select & Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {suggestions.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No suggestions could be generated. Please try again or adjust your preferences.
          </p>
          <Button onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      )}

      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Change Preferences
        </Button>
        <Button variant="outline" onClick={onRegenerate}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate New Options
        </Button>
      </div>
    </motion.div>
  );
};

export default TripSuggestions;
