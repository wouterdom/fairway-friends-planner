import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, MapPin, Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DiscoverableCourse, CourseRecommendation } from '@/types/golf';

interface CourseMapProps {
  accommodationAddress?: string;
  accommodationLocation?: { lat: number; lng: number };
  selectedCourses: CourseRecommendation[];
  aiSuggestedCourseNames: string[];
  onAddCourse: (course: CourseRecommendation) => void;
  onRemoveCourse: (index: number) => void;
  maxCourses?: number;
}

const CourseMap: React.FC<CourseMapProps> = ({
  accommodationAddress,
  accommodationLocation,
  selectedCourses,
  aiSuggestedCourseNames,
  onAddCourse,
  onRemoveCourse,
  maxCourses = 7,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  const [discoverableCourses, setDiscoverableCourses] = useState<DiscoverableCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch mapbox token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

  // Fetch nearby courses when accommodation is set
  useEffect(() => {
    const discoverCourses = async () => {
      if (!accommodationAddress && !accommodationLocation) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('discover-courses', {
          body: {
            address: accommodationAddress,
            latitude: accommodationLocation?.lat,
            longitude: accommodationLocation?.lng,
            radiusKm: 50,
          }
        });

        if (error) throw error;

        // Mark AI-suggested courses
        const coursesWithAiFlag = (data.courses || []).map((course: DiscoverableCourse) => ({
          ...course,
          isAiSuggested: aiSuggestedCourseNames.some(
            name => name.toLowerCase().includes(course.name.toLowerCase()) ||
                    course.name.toLowerCase().includes(name.toLowerCase())
          ),
        }));

        setDiscoverableCourses(coursesWithAiFlag);
        setSearchCenter(data.searchCenter);
      } catch (error) {
        console.error('Error discovering courses:', error);
        toast.error('Failed to discover nearby courses');
      } finally {
        setIsLoading(false);
      }
    };

    discoverCourses();
  }, [accommodationAddress, accommodationLocation, aiSuggestedCourseNames]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter = searchCenter || accommodationLocation || { lat: 51.5074, lng: -0.1278 };
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [initialCenter.lng, initialCenter.lat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update map center when search center changes
  useEffect(() => {
    if (map.current && searchCenter) {
      map.current.flyTo({
        center: [searchCenter.lng, searchCenter.lat],
        zoom: 10,
        duration: 1500,
      });
    }
  }, [searchCenter]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add accommodation marker
    if (searchCenter) {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg';
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([searchCenter.lng, searchCenter.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Your Accommodation</strong>'))
        .addTo(map.current);
      
      markersRef.current.push(marker);
    }

    // Add course markers
    discoverableCourses.forEach((course) => {
      const isSelected = selectedCourses.some(sc => 
        sc.name.toLowerCase() === course.name.toLowerCase()
      );
      
      const el = document.createElement('div');
      el.className = `flex items-center justify-center w-8 h-8 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 ${
        isSelected 
          ? 'bg-green-600 text-white' 
          : course.isAiSuggested 
            ? 'bg-accent text-accent-foreground ring-2 ring-accent' 
            : 'bg-muted text-muted-foreground'
      }`;
      el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
      
      el.addEventListener('click', () => {
        setSelectedCourseId(course.placeId);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([course.location.lng, course.location.lat])
        .addTo(map.current!);
      
      markersRef.current.push(marker);
    });
  }, [discoverableCourses, selectedCourses, searchCenter]);

  const handleAddCourse = (course: DiscoverableCourse) => {
    if (selectedCourses.length >= maxCourses) {
      toast.error(`Maximum ${maxCourses} courses allowed`);
      return;
    }

    const courseRec: CourseRecommendation = {
      name: course.name,
      location: course.address,
      rating: course.rating || 4.0,
      description: course.isAiSuggested ? 'AI Recommended' : 'Nearby course',
      greenFee: course.priceLevel ? course.priceLevel * 50 + 100 : 150,
    };

    onAddCourse(courseRec);
    setSelectedCourseId(null);
    toast.success(`Added ${course.name}`);
  };

  const selectedCourseInfo = discoverableCourses.find(c => c.placeId === selectedCourseId);
  const isAlreadySelected = selectedCourseInfo && selectedCourses.some(
    sc => sc.name.toLowerCase() === selectedCourseInfo.name.toLowerCase()
  );

  if (!mapboxToken) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <p>Loading map...</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5" />
          Discover Nearby Courses
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div className="relative rounded-lg overflow-hidden border">
          <div ref={mapContainer} className="h-[300px] w-full" />
          
          {/* Legend */}
          <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Accommodation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent ring-1 ring-accent" />
              <span>AI Suggested</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Available</span>
            </div>
          </div>
        </div>

        {/* Selected course popup */}
        {selectedCourseInfo && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{selectedCourseInfo.name}</h4>
                    {selectedCourseInfo.isAiSuggested && (
                      <Badge variant="secondary" className="text-xs">AI Suggested</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{selectedCourseInfo.address}</p>
                  {selectedCourseInfo.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm">{selectedCourseInfo.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isAlreadySelected ? (
                    <Button
                      size="sm"
                      onClick={() => handleAddCourse(selectedCourseInfo)}
                      disabled={selectedCourses.length >= maxCourses}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  ) : (
                    <Badge variant="outline" className="bg-green-50">Added</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCourseId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course list */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            {discoverableCourses.length} courses found nearby
          </p>
          {discoverableCourses
            .sort((a, b) => (b.isAiSuggested ? 1 : 0) - (a.isAiSuggested ? 1 : 0))
            .slice(0, 10)
            .map((course) => {
              const isSelected = selectedCourses.some(
                sc => sc.name.toLowerCase() === course.name.toLowerCase()
              );
              return (
                <div
                  key={course.placeId}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedCourseId === course.placeId 
                      ? 'bg-primary/10' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCourseId(course.placeId)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-green-600' : course.isAiSuggested ? 'bg-accent' : 'bg-muted-foreground'
                    }`} />
                    <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                      {course.name}
                    </span>
                    {course.isAiSuggested && (
                      <Badge variant="secondary" className="text-xs">AI</Badge>
                    )}
                  </div>
                  {course.rating && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {course.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseMap;
