import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TripSuggestion, TripPreferences, CourseRecommendation } from '@/types/golf';
import { ChevronLeft, Check, MapPin, DollarSign, Star, Trash2, Edit3 } from 'lucide-react';
import CourseMap from './CourseMap';

interface TripEditorProps {
  suggestion: TripSuggestion;
  preferences: Partial<TripPreferences>;
  onConfirm: (finalPreferences: TripPreferences) => void;
  onBack: () => void;
}

const TripEditor: React.FC<TripEditorProps> = ({
  suggestion,
  preferences,
  onConfirm,
  onBack,
}) => {
  const [tripName, setTripName] = useState(suggestion.name);
  const [destination, setDestination] = useState(suggestion.destination);
  const [selectedCourses, setSelectedCourses] = useState<CourseRecommendation[]>(suggestion.courses);
  const [isEditingName, setIsEditingName] = useState(false);

  const removeCourse = (index: number) => {
    setSelectedCourses(prev => prev.filter((_, i) => i !== index));
  };

  const addCourse = (course: CourseRecommendation) => {
    setSelectedCourses(prev => [...prev, course]);
  };

  const handleConfirm = () => {
    const finalPreferences: TripPreferences = {
      tripName,
      destination,
      startDate: preferences.startDate || '',
      endDate: preferences.endDate || '',
      golfStyle: preferences.golfStyle || 'mixed',
      accommodationType: preferences.accommodationType || 'resort',
      budgetRange: preferences.budgetRange || 'moderate',
      additionalActivities: preferences.additionalActivities || [],
      courses: selectedCourses.map(c => c.name),
      playerCount: preferences.playerCount || 8,
      region: preferences.region,
      hasAccommodation: preferences.hasAccommodation,
      accommodationAddress: preferences.accommodationAddress,
    };
    onConfirm(finalPreferences);
  };

  // Get accommodation address for map - either from user input or from suggestion destination
  const accommodationAddress = preferences.hasAccommodation && preferences.accommodationAddress
    ? preferences.accommodationAddress
    : destination;

  // Get AI-suggested course names for highlighting on map
  const aiSuggestedCourseNames = suggestion.courses.map(c => c.name);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Edit3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold text-foreground">Customize Your Trip</h2>
        <p className="text-muted-foreground mt-2">
          Review and adjust the details before confirming
        </p>
      </div>

      {/* Trip Name */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  className="text-lg font-display font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={() => setIsEditingName(false)}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-display font-bold text-foreground">{tripName}</h3>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="text-sm">{destination}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)}>
                  <Edit3 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trip Details Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trip Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Dates:</span>
              <p className="font-medium">{preferences.startDate} - {preferences.endDate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Players:</span>
              <p className="font-medium">{preferences.playerCount} golfers</p>
            </div>
            <div>
              <span className="text-muted-foreground">Style:</span>
              <p className="font-medium capitalize">{preferences.golfStyle}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Budget:</span>
              <p className="font-medium capitalize">{preferences.budgetRange}</p>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <span className="text-muted-foreground text-sm">Estimated cost:</span>
            <p className="text-2xl font-bold text-primary">
              ${suggestion.estimatedCostPerPerson.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/person</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Course Map - for discovering and adding courses */}
      <CourseMap
        accommodationAddress={accommodationAddress}
        selectedCourses={selectedCourses}
        aiSuggestedCourseNames={aiSuggestedCourseNames}
        onAddCourse={addCourse}
        onRemoveCourse={removeCourse}
        maxCourses={preferences.golfDays || 7}
      />

      {/* Selected Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Selected Courses ({selectedCourses.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCourses.map((course, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{course.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {course.location}
                  </span>
                  <span className="flex items-center">
                    <Star className="w-3 h-3 mr-1 text-accent" />
                    {course.rating}
                  </span>
                  <span className="flex items-center">
                    <DollarSign className="w-3 h-3" />
                    {course.greenFee}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCourse(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {selectedCourses.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No courses selected. Use the map above to add courses.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trip Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {suggestion.highlights.map((highlight, index) => (
              <Badge key={index} variant="secondary">
                {highlight}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Options
        </Button>
        <Button onClick={handleConfirm} size="lg">
          <Check className="w-4 h-4 mr-2" />
          Confirm & Create Trip
        </Button>
      </div>
    </motion.div>
  );
};

export default TripEditor;
