import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookReward {
  book_id: string;
  book_title: string;
  book_price: number;
  total_revenue: number;
  reward_amount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user_id from request body or use authenticated user
    const { user_id } = await req.json().catch(() => ({ user_id: user.id }));
    const targetUserId = user_id || user.id;

    console.log(`Calculating book rewards for user: ${targetUserId}`);

    // Get all completed transactions for the user's books
    const { data: transactionData, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .select(`
        book_id,
        total_amount,
        status,
        book:book_id (
          id,
          title,
          price,
          user_id
        )
      `)
      .eq('book.user_id', targetUserId)
      .eq('status', 'completed');

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError);
      return new Response(
        JSON.stringify({ error: '거래 데이터를 가져올 수 없습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transactionData || transactionData.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: '완료된 거래가 없습니다.',
          eligible_books: [],
          total_reward: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group transactions by book_id and calculate total revenue
    const bookRevenues = new Map<string, {
      book_id: string;
      book_title: string;
      book_price: number;
      total_revenue: number;
    }>();

    for (const transaction of transactionData) {
      if (!transaction.book || !transaction.total_amount) continue;

      const bookId = transaction.book_id;
      const amount = transaction.total_amount;
      
      if (bookRevenues.has(bookId)) {
        const existing = bookRevenues.get(bookId)!;
        existing.total_revenue += amount;
      } else {
        bookRevenues.set(bookId, {
          book_id: bookId,
          book_title: transaction.book.title,
          book_price: transaction.book.price,
          total_revenue: amount
        });
      }
    }

    // Find books where revenue exceeds price
    const eligibleBooks: BookReward[] = [];
    let totalReward = 0;

    for (const bookData of bookRevenues.values()) {
      if (bookData.total_revenue >= bookData.book_price) {
        // Check if user already received reward for this book
        const { data: existingClaim } = await supabaseAdmin
          .from('reward_claims')
          .select('id')
          .eq('user_id', targetUserId)
          .contains('eligible_books', [{ book_id: bookData.book_id }])
          .single();

        if (!existingClaim) {
          const reward: BookReward = {
            ...bookData,
            reward_amount: bookData.book_price
          };
          eligibleBooks.push(reward);
          totalReward += bookData.book_price;
        }
      }
    }

    if (eligibleBooks.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: '현재 보상 대상 도서가 없습니다.',
          eligible_books: [],
          total_reward: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create reward claim
    const { data: rewardClaim, error: claimError } = await supabaseAdmin
      .from('reward_claims')
      .insert({
        user_id: targetUserId,
        total_reward_value: totalReward,
        eligible_books: eligibleBooks.map(book => ({
          book_id: book.book_id,
          book_title: book.book_title,
          book_price: book.book_price,
          total_revenue: book.total_revenue,
          reward_amount: book.reward_amount
        })),
        status: 'pending'
      })
      .select()
      .single();

    if (claimError) {
      console.error('Reward claim creation error:', claimError);
      return new Response(
        JSON.stringify({ error: '보상 신청을 생성할 수 없습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add points to user's wallet
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .upsert({
        user_id: targetUserId,
        balance: 0
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: true
      });

    if (walletError) {
      console.error('Wallet upsert error:', walletError);
    }

    // Update wallet balance
    const { error: balanceError } = await supabaseAdmin.rpc('increment_wallet_balance', {
      user_id_param: targetUserId,
      amount_param: totalReward
    });

    if (balanceError) {
      console.error('Balance update error:', balanceError);
      // Try direct update if RPC fails
      const { data: currentWallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', targetUserId)
        .single();

      if (currentWallet) {
        await supabaseAdmin
          .from('wallets')
          .update({ balance: currentWallet.balance + totalReward })
          .eq('user_id', targetUserId);
      }
    }

    // Record wallet transaction
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: targetUserId,
        amount: totalReward,
        transaction_type: 'reward',
        description: `도서 대여 수익 보상 (${eligibleBooks.length}권)`
      });

    // Update reward claim status to completed
    await supabaseAdmin
      .from('reward_claims')
      .update({ status: 'completed' })
      .eq('id', rewardClaim.id);

    console.log(`Reward processed: ${totalReward} points for ${eligibleBooks.length} books`);

    return new Response(
      JSON.stringify({
        message: '보상이 성공적으로 지급되었습니다.',
        reward_claim_id: rewardClaim.id,
        eligible_books: eligibleBooks,
        total_reward: totalReward,
        points_added: totalReward
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-book-rewards:', error);
    return new Response(
      JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});