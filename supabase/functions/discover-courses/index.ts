import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Location {
  lat: number;
  lng: number;
}

interface Course {
  placeId: string;
  name: string;
  address: string;
  location: Location;
  rating?: number;
  priceLevel?: number;
  distanceKm?: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const latitude = typeof body.latitude === "number" ? body.latitude : undefined;
    const longitude = typeof body.longitude === "number" ? body.longitude : undefined;
    const radiusKm = clamp(Number(body.radiusKm ?? 50) || 50, 5, 200);

    let center: Location | null = null;

    if (typeof latitude === "number" && typeof longitude === "number") {
      center = { lat: latitude, lng: longitude };
    } else if (address) {
      // Use Places API Find Place (does NOT require Geocoding API to be enabled)
      console.log("Finding place for address:", address);

      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        address.slice(0, 200),
      )}&inputtype=textquery&fields=geometry,formatted_address,name&key=${GOOGLE_PLACES_API_KEY}`;

      const findResp = await fetch(findUrl);
      const findData = await findResp.json();

      if (findData.status !== "OK" || !findData.candidates?.[0]?.geometry?.location) {
        const msg = findData.error_message ? ` (${findData.error_message})` : "";
        throw new Error(`Failed to locate address: ${findData.status}${msg}`);
      }

      center = {
        lat: findData.candidates[0].geometry.location.lat,
        lng: findData.candidates[0].geometry.location.lng,
      };

      console.log("Address resolved to:", center);
    }

    if (!center) {
      throw new Error("Either address or latitude/longitude must be provided");
    }

    const radiusMeters = Math.round(radiusKm * 1000);
    console.log(`Searching golf courses within ${radiusKm}km of ${center.lat}, ${center.lng}`);

    // Nearby Search works well for radius searches
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(
      "golf course",
    )}&type=golf_course&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      const msg = searchData.error_message ? ` (${searchData.error_message})` : "";
      console.error("Places Nearby Search error:", searchData);
      throw new Error(`Places API error: ${searchData.status}${msg}`);
    }

    const courses: Course[] = (searchData.results || []).map((place: any) => {
      const loc = place.geometry?.location;
      const courseLoc = { lat: loc?.lat, lng: loc?.lng } as Location;
      const distanceKm =
        typeof courseLoc.lat === "number" && typeof courseLoc.lng === "number"
          ? calculateDistance(center!.lat, center!.lng, courseLoc.lat, courseLoc.lng)
          : undefined;

      return {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address || "",
        location: courseLoc,
        rating: place.rating,
        priceLevel: place.price_level,
        distanceKm,
      };
    });

    // Sort by distance if we have it
    courses.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

    console.log(`Found ${courses.length} golf courses`);

    return new Response(JSON.stringify({ courses, searchCenter: center, radiusKm }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in discover-courses:", error);
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
