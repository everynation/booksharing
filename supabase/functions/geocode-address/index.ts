import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { address, latitude, longitude, reverseGeocode } = await req.json();
    
    if (reverseGeocode && latitude && longitude) {
      // Reverse geocoding: convert coordinates to address
      return await handleReverseGeocode(latitude, longitude);
    } else if (address) {
      // Forward geocoding: convert address to coordinates
      return await handleGeocode(address);
    } else {
      return new Response(
        JSON.stringify({ error: 'Address or coordinates are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in geocode-address function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleGeocode(address: string) {
  // Get Kakao API key from environment
  const kakaoApiKey = Deno.env.get('KAKAO_API_KEY');
  
  if (!kakaoApiKey) {
    console.error('KAKAO_API_KEY not found in environment variables');
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Call Kakao Local API for geocoding
  const geocodeUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  
  const response = await fetch(geocodeUrl, {
    headers: {
      'Authorization': `KakaoAK ${kakaoApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Kakao API error:', response.status, response.statusText);
    return new Response(
      JSON.stringify({ error: 'Geocoding failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const data = await response.json();
  
  if (!data.documents || data.documents.length === 0) {
    return new Response(
      JSON.stringify({ 
        latitude: null, 
        longitude: null, 
        message: 'No coordinates found for this address' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const location = data.documents[0];
  const latitude = parseFloat(location.y);
  const longitude = parseFloat(location.x);

  return new Response(
    JSON.stringify({ 
      latitude, 
      longitude,
      address: location.address_name || address
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

async function handleReverseGeocode(latitude: number, longitude: number) {
  // Get Kakao API key from environment
  const kakaoApiKey = Deno.env.get('KAKAO_API_KEY');
  
  if (!kakaoApiKey) {
    console.error('KAKAO_API_KEY not found in environment variables');
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Call Kakao Local API for reverse geocoding
  const reverseGeocodeUrl = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`;
  
  const response = await fetch(reverseGeocodeUrl, {
    headers: {
      'Authorization': `KakaoAK ${kakaoApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error('Kakao API error:', response.status, response.statusText);
    return new Response(
      JSON.stringify({ error: 'Reverse geocoding failed' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const data = await response.json();
  
  if (!data.documents || data.documents.length === 0) {
    return new Response(
      JSON.stringify({ 
        address: `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`,
        latitude,
        longitude
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const location = data.documents[0];
  const address = location.road_address?.address_name || location.address?.address_name || 
                 `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`;

  return new Response(
    JSON.stringify({ 
      address,
      latitude,
      longitude
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}