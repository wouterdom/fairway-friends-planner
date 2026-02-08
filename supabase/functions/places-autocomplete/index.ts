import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      // Return 200 to avoid blank-screening the app; UI can still work without suggestions.
      return jsonResponse({
        predictions: [],
        warning: "Autocomplete is not configured (missing GOOGLE_PLACES_API_KEY).",
      });
    }

    const { input, types } = await req.json().catch(() => ({ input: "", types: "address" }));

    if (!input || String(input).length < 2) {
      return jsonResponse({ predictions: [] });
    }

    // Places API (New): https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
    // NOTE: FieldMask is required by Places API (New) for many endpoints; we set it to only what we need.
    const fieldMask = [
      "suggestions.placePrediction.placeId",
      "suggestions.placePrediction.text.text",
      "suggestions.placePrediction.structuredFormat.mainText.text",
      "suggestions.placePrediction.structuredFormat.secondaryText.text",
    ].join(",");

    const body: Record<string, unknown> = {
      input: String(input),
      languageCode: "en",
    };

    // Basic bias toward addresses when requested.
    if (types === "address") {
      body.includedPrimaryTypes = ["street_address", "premise", "route"];
    }

    const resp = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    const data = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })();

    if (!resp.ok) {
      const msg =
        data?.error?.message ||
        data?.error?.status ||
        `Places API HTTP ${resp.status}`;

      console.error("Places API (New) request failed:", {
        status: resp.status,
        msg,
        body: data ?? text,
      });

      // IMPORTANT: Avoid 500 here so the UI doesn't blank-screen.
      // If the key/API isn't enabled or is restricted, we return empty predictions with a helpful warning.
      return jsonResponse({
        predictions: [],
        warning: msg,
        hint:
          "If this persists, enable Places API (New) in your Google Cloud project and ensure the API key allows server-side requests (no HTTP referrer-only restriction).",
      });
    }

    if (data?.error) {
      console.error("Places API (New) error payload:", data.error);
      return jsonResponse({
        predictions: [],
        warning: data.error.message || data.error.status || "Places API error",
      });
    }

    const predictions = (data?.suggestions || [])
      .map((s: any) => ({
        placeId: s?.placePrediction?.placeId,
        description: s?.placePrediction?.text?.text,
        mainText: s?.placePrediction?.structuredFormat?.mainText?.text,
        secondaryText: s?.placePrediction?.structuredFormat?.secondaryText?.text,
      }))
      .filter((p: any) => p.placeId && p.description);

    return jsonResponse({ predictions });
  } catch (error: unknown) {
    console.error("Error in places-autocomplete:", error);
    // Avoid 500 to prevent UI blank screens; return empty predictions instead.
    return jsonResponse({
      predictions: [],
      warning: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
