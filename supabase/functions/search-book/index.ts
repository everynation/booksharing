import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isbn } = await req.json();

    if (!isbn) {
      return new Response(
        JSON.stringify({ error: 'ISBN is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 카카오 책 검색 API 호출
    const KAKAO_API_KEY = Deno.env.get('KAKAO_API_KEY');
    
    if (!KAKAO_API_KEY) {
      // API 키가 없으면 더미 데이터 반환
      const dummyData = {
        documents: [{
          title: `스캔된 책 (ISBN: ${isbn})`,
          authors: ['알 수 없는 작가'],
          publisher: '알 수 없는 출판사',
          thumbnail: '/placeholder.svg',
          translators: [],
          datetime: new Date().toISOString(),
          isbn: isbn,
          contents: '책 정보를 자동으로 불러올 수 없습니다. 수동으로 입력해주세요.',
          url: '',
          sale_price: 0,
          price: 0,
          status: 'unknown'
        }]
      };

      return new Response(
        JSON.stringify(dummyData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const response = await fetch(
      `https://dapi.kakao.com/v3/search/book?query=${isbn}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching book info:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch book information',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});