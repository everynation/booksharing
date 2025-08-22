import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { bookId } = await req.json();

    // Get book details
    const { data: book, error: bookError } = await supabaseClient
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      throw new Error("Book not found");
    }

    if (!book.for_rental) {
      throw new Error("Book is not available for rental");
    }

    if (book.user_id === user.id) {
      throw new Error("Cannot rent your own book");
    }

    // Create rental contract
    const { data: contract, error: contractError } = await supabaseClient
      .from('rental_contracts')
      .insert({
        book_id: bookId,
        owner_id: book.user_id,
        borrower_id: user.id,
        daily_price: book.rental_daily || 0,
        late_daily_price: book.late_daily || book.rental_daily || 0,
        new_book_price_cap: book.new_book_price || 50000, // Default fallback
        status: 'PENDING'
      })
      .select()
      .single();

    if (contractError) {
      console.error("Contract creation error:", contractError);
      throw new Error("Failed to create rental contract");
    }

    return new Response(JSON.stringify({ contract }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});