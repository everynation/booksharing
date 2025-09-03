import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleBooksRequest {
  isbn: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { isbn }: GoogleBooksRequest = await req.json();

    if (!isbn) {
      return new Response(
        JSON.stringify({ error: 'ISBN is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Searching Google Books for ISBN:', isbn);

    // Search Google Books API
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    
    const response = await fetch(googleBooksUrl);
    const data = await response.json();

    console.log('Google Books API response:', JSON.stringify(data, null, 2));

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ 
          documents: [],
          message: 'No books found with the provided ISBN'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Transform Google Books data to match Kakao Books format
    const book = data.items[0].volumeInfo;
    const transformedBook = {
      title: book.title || '',
      authors: book.authors || [],
      isbn: isbn,
      thumbnail: book.imageLinks?.thumbnail || book.imageLinks?.smallThumbnail || '',
      publisher: book.publisher || '',
      publishedDate: book.publishedDate || '',
      description: book.description || '',
      pageCount: book.pageCount || 0,
      categories: book.categories || []
    };

    return new Response(
      JSON.stringify({ 
        documents: [transformedBook],
        source: 'google_books'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in search-google-books function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        documents: []
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);