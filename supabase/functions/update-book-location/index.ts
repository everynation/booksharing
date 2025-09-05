import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { book_id, address } = await req.json()

    if (!book_id || !address) {
      return new Response(
        JSON.stringify({ error: 'book_id and address are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Kakao API key
    const kakaoApiKey = Deno.env.get('KAKAO_API_KEY')
    if (!kakaoApiKey) {
      throw new Error('KAKAO_API_KEY not found in environment variables')
    }

    // Geocode the address using Kakao Maps API
    const geocodeResponse = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${kakaoApiKey}`
        }
      }
    )

    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding failed: ${geocodeResponse.status}`)
    }

    const geocodeData = await geocodeResponse.json()
    
    if (!geocodeData.documents || geocodeData.documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Address not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const location = geocodeData.documents[0]
    const latitude = parseFloat(location.y)
    const longitude = parseFloat(location.x)

    // Update book with coordinates
    const { error: updateError } = await supabaseClient
      .from('books')
      .update({ 
        latitude,
        longitude,
        address
      })
      .eq('id', book_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        latitude, 
        longitude,
        address: location.address_name || address
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})