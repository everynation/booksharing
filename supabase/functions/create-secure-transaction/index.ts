import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransactionRequest {
  book_id: string;
  borrower_id: string;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { book_id, borrower_id, status }: TransactionRequest = await req.json()

    // Validate input
    if (!book_id || !borrower_id || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the requesting user is the borrower
    if (user.id !== borrower_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Can only create transactions for yourself' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the book and its owner using admin privileges
    const { data: book, error: bookError } = await supabaseAdmin
      .from('books')
      .select('id, user_id, title, status')
      .eq('id', book_id)
      .single()

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if book is available
    if (book.status !== 'available') {
      return new Response(
        JSON.stringify({ error: 'Book is not available for transaction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is trying to borrow their own book
    if (book.user_id === borrower_id) {
      return new Response(
        JSON.stringify({ error: 'Cannot borrow your own book' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the transaction with the book owner's ID
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        book_id,
        borrower_id,
        owner_id: book.user_id, // We can access this with admin privileges
        status
      })
      .select('id')
      .single()

    if (transactionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction', details: transactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create initial message
    const initialMessage = `📚 "${book.title}" 책을 대여하고 싶습니다.`
    const { error: messageError } = await supabaseAdmin
      .from('messages')
      .insert({
        transaction_id: transaction.id,
        sender_id: borrower_id,
        receiver_id: book.user_id,
        message: initialMessage
      })

    if (messageError) {
      console.error('Failed to create initial message:', messageError)
      // Don't fail the transaction if message creation fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: transaction.id,
        message: 'Transaction created successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in create-secure-transaction function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})