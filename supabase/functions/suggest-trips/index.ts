import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CourseWithDistance {
  name: string;
  location: string;
  rating: number;
  description: string;
  greenFee: number;
  distanceKm?: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log("Generating trip suggestions for preferences:", preferences);

    // If user already has accommodation: build suggestions around that exact location.
    if (preferences.hasAccommodation && preferences.accommodationAddress) {
      if (!GOOGLE_PLACES_API_KEY) {
        throw new Error("GOOGLE_PLACES_API_KEY is not configured");
      }

      const accommodationAddress = String(preferences.accommodationAddress).trim().slice(0, 200);
      const golfDays = Number(preferences.golfDays || 3);
      const requiredCount =
        preferences.courseVariety === "same" ? 1 : preferences.courseVariety === "mix" ? Math.min(3, golfDays) : golfDays;

      // Find accommodation coords via Places Find Place (no Geocoding API needed)
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        accommodationAddress,
      )}&inputtype=textquery&fields=geometry,formatted_address,name&key=${GOOGLE_PLACES_API_KEY}`;

      const findResp = await fetch(findUrl);
      const findData = await findResp.json();

      if (findData.status !== "OK" || !findData.candidates?.[0]?.geometry?.location) {
        const msg = findData.error_message ? ` (${findData.error_message})` : "";
        throw new Error(`Failed to locate accommodation address: ${findData.status}${msg}`);
      }

      const center = {
        lat: findData.candidates[0].geometry.location.lat,
        lng: findData.candidates[0].geometry.location.lng,
      };

      // Find courses nearby (50km)
      const radiusMeters = 50000;
      const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(
        "golf course",
      )}&type=golf_course&key=${GOOGLE_PLACES_API_KEY}`;

      const nearbyResp = await fetch(nearbyUrl);
      const nearbyData = await nearbyResp.json();

      if (nearbyData.status !== "OK" && nearbyData.status !== "ZERO_RESULTS") {
        const msg = nearbyData.error_message ? ` (${nearbyData.error_message})` : "";
        throw new Error(`Places API error: ${nearbyData.status}${msg}`);
      }

      const nearbyCourses: CourseWithDistance[] = (nearbyData.results || []).map((place: any) => {
        const loc = place.geometry?.location;
        const distanceKm = calculateDistance(center.lat, center.lng, loc.lat, loc.lng);
        return {
          name: place.name,
          location: place.vicinity || place.formatted_address || "",
          rating: place.rating || 4.0,
          description: `${distanceKm.toFixed(1)}km from your accommodation`,
          greenFee: place.price_level ? place.price_level * 40 + 80 : 120,
          distanceKm,
        };
      });

      nearbyCourses.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

      if (nearbyCourses.length === 0) {
        return new Response(JSON.stringify({
          suggestions: [
            {
              id: "no-courses-found",
              name: "No courses found nearby",
              destination: accommodationAddress,
              description: "We couldn't find any golf courses within 50km of your accommodation.",
              courses: [],
              accommodations: [
                {
                  name: "Your Booked Accommodation",
                  type: "rental",
                  pricePerNight: 0,
                  description: accommodationAddress,
                },
              ],
              estimatedCostPerPerson: 0,
              highlights: ["Try a different address format", "Increase search radius (coming next)", "Check spelling"],
              bestTimeToVisit: "Year-round",
            },
          ],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const closest = nearbyCourses.slice(0, requiredCount);
      const topRated = [...nearbyCourses].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, requiredCount);
      const variety = nearbyCourses.filter((_, i) => i % 2 === 0).slice(0, requiredCount);

      const makeSuggestion = (id: string, name: string, courses: CourseWithDistance[]) => {
        const estimatedCostPerPerson = courses.reduce((sum, c) => sum + (c.greenFee || 0), 0) + 250;
        const maxDistance = Math.max(...courses.map((c) => c.distanceKm || 0));
        return {
          id,
          name,
          destination: accommodationAddress,
          description: `Courses within ${maxDistance.toFixed(1)}km of your accommodation.`,
          courses,
          accommodations: [
            {
              name: "Your Booked Accommodation",
              type: "rental",
              pricePerNight: 0,
              description: accommodationAddress,
            },
          ],
          estimatedCostPerPerson,
          highlights: [
            "All courses nearby",
            `Up to ${maxDistance.toFixed(1)}km from your stay`,
            "Real course data",
            "Easy logistics",
          ],
          bestTimeToVisit: "Spring/Fall",
        };
      };

      const suggestions = [
        makeSuggestion("nearby-closest", "Closest Courses", closest),
        makeSuggestion("nearby-top-rated", "Top Rated Nearby", topRated),
        makeSuggestion("nearby-variety", "A Bit of Variety", variety.length ? variety : closest),
      ];

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal flow (no fixed accommodation): use AI as before.
    const systemPrompt = `You are an expert golf travel advisor. Based on the user's preferences, generate 3 unique golf trip suggestions. Each suggestion should include realistic course recommendations, estimated costs, and highlights.

For each suggestion, provide:
1. A creative trip name
2. Specific destination within the requested region
3. 3-4 recommended golf courses with realistic details
4. Accommodation options matching their preference
5. Estimated cost per person (realistic for the budget range)
6. 4-5 trip highlights

Budget ranges:
- budget: €100-200/day per person
- moderate: €200-400/day per person  
- luxury: €400+/day per person

Always respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "id": "unique-id",
      "name": "Trip Name",
      "destination": "City, Country",
      "description": "Brief 2-sentence description of the trip",
      "courses": [
        {
          "name": "Course Name",
          "location": "City",
          "rating": 4.5,
          "description": "Brief description",
          "greenFee": 150
        }
      ],
      "accommodations": [
        {
          "name": "Hotel Name",
          "type": "hotel|resort|rental",
          "pricePerNight": 200,
          "description": "Brief description"
        }
      ],
      "estimatedCostPerPerson": 2500,
      "highlights": ["highlight1", "highlight2"],
      "bestTimeToVisit": "Spring/Fall"
    }
  ]
}`;

    let locationConstraint = "";
    if (preferences.travelMode === "driving" && preferences.startingLocation) {
      locationConstraint = `CRITICAL: The traveler is DRIVING from ${preferences.startingLocation} with a maximum driving distance of ${preferences.maxDrivingDistance || 300} kilometers. You MUST suggest golf destinations that are within ${preferences.maxDrivingDistance || 300}km driving distance from ${preferences.startingLocation}. Focus on destinations in nearby countries/regions that are reachable by car.`;
    } else if (preferences.region) {
      locationConstraint = `The traveler wants to FLY to ${preferences.region}. Suggest destinations within that region.`;
    } else {
      locationConstraint = "The traveler is flexible on destination.";
    }

    const gameFormats = preferences.daySchedules?.map((day: any) => `Day ${day.dayNumber}: ${day.gameFormat} (${day.scoringType}${day.hasSkins ? " + skins" : ""})`).join(", ") || "not specified";

    const golfDays = clamp(Number(preferences.golfDays || 3), 1, 7);
    let courseVarietyDesc = "";
    if (preferences.courseVariety === "same") {
      courseVarietyDesc = `The group wants to play the SAME course all ${golfDays} days. Suggest accommodations near ONE excellent course and recommend playing that course ${golfDays} times.`;
    } else if (preferences.courseVariety === "mix") {
      courseVarietyDesc = `The group wants a MIX - some days at the same course, some at different courses. Suggest 2-3 courses for ${golfDays} days of golf.`;
    } else {
      courseVarietyDesc = `The group wants to play a DIFFERENT course each day. Suggest ${golfDays} different courses for ${golfDays} days of golf.`;
    }

    const accommodationTypes: Record<string, string> = {
      hotel: "a traditional hotel with golf nearby",
      resort: "a full-service golf resort with on-site or nearby courses",
      rental: "a vacation rental home or villa that can accommodate the group",
      flexible: "any type of accommodation that fits the trip",
    };
    const accommodationType = preferences.accommodationType || "flexible";
    const accommodationDesc = accommodationTypes[accommodationType] || accommodationTypes.flexible;

    const userPrompt = `Generate 3 golf trip suggestions with these preferences:

LOCATION REQUIREMENT:
${locationConstraint}

ACCOMMODATION REQUIREMENT:
- Type: ${preferences.accommodationType || "flexible"} - ${accommodationDesc}
- Budget: ${preferences.budgetRange || "moderate"} (budget: €100-200/day, moderate: €200-400/day, luxury: €400+/day per person)
- Each suggestion should CENTER around the accommodation - find great places to stay first, then recommend courses nearby

COURSE REQUIREMENTS:
- Golf days: ${golfDays}
- ${courseVarietyDesc}

TRIP DETAILS:
- Dates: ${preferences.startDate} to ${preferences.endDate}
- Number of players: ${preferences.playerCount || 8}
- Leaderboard type: ${preferences.leaderboardType || "individual"}
- Game formats by day: ${gameFormats}

IMPORTANT RULES:
1. If travel mode is "driving", ALL destinations MUST be within ${preferences.maxDrivingDistance || 300}km of ${preferences.startingLocation}. Do NOT suggest destinations requiring flights.
2. Each suggestion must include ${preferences.courseVariety === "same" ? "1 course (played multiple times)" : preferences.courseVariety === "mix" ? "2-3 courses" : `${golfDays} different courses`}
3. Accommodation should match the requested type (${preferences.accommodationType || "flexible"})
4. Ensure courses are realistic and within reasonable distance of the accommodation

Make sure each suggestion is distinct and offers a different experience.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    console.log("AI response:", content);

    let suggestions;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || parsed;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      suggestions = generateFallbackSuggestions(preferences);
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in suggest-trips:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateFallbackSuggestions(preferences: any) {
  return [
    {
      id: "default-1",
      name: "Premium Golf Getaway",
      destination: preferences.region || "Scottsdale, Arizona",
      description: "A curated golf experience featuring top-rated courses and premium accommodations tailored to your preferences.",
      courses: [
        { name: "Championship Course", location: "Local Area", rating: 4.5, description: "Premier 18-hole course", greenFee: 175 },
        { name: "Desert Links", location: "Local Area", rating: 4.3, description: "Scenic desert golf", greenFee: 150 },
      ],
      accommodations: [{ name: "Golf Resort & Spa", type: "resort", pricePerNight: 250, description: "On-site golf resort" }],
      estimatedCostPerPerson: 2200,
      highlights: ["Multiple course options", "Spa amenities", "Fine dining", "Convenient location"],
      bestTimeToVisit: "Spring/Fall",
    },
  ];
}
