import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRewardRequest {
  eligible_books: Array<{
    id: string;
    title: string;
    author: string;
    price: number;
    total_earnings: number;
    completed_transactions: number;
  }>;
  delivery_address?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('User authentication failed');
    }

    const { eligible_books, delivery_address }: ClaimRewardRequest = await req.json();

    if (!eligible_books || eligible_books.length === 0) {
      throw new Error('No eligible books provided');
    }

    // Calculate total reward value
    const totalRewardValue = eligible_books.reduce((sum, book) => sum + book.total_earnings, 0);

    // Get user's profile for delivery address if not provided
    let finalDeliveryAddress = delivery_address;
    if (!finalDeliveryAddress) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('user_id', user.id)
        .single();
      
      finalDeliveryAddress = profile?.address || '';
    }

    // Check if user already has a pending reward claim
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingClaim) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '이미 처리 중인 보상 신청이 있습니다.' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create reward claim record
    const { data: rewardClaim, error: claimError } = await supabase
      .from('reward_claims')
      .insert({
        user_id: user.id,
        eligible_books,
        total_reward_value: totalRewardValue,
        delivery_address: finalDeliveryAddress,
        status: 'pending'
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating reward claim:', claimError);
      throw new Error('Failed to create reward claim');
    }

    // Get user display name for admin notification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    // Log the reward claim for admin review
    console.log('New reward claim created:', {
      claim_id: rewardClaim.id,
      user_id: user.id,
      user_display_name: userProfile?.display_name || '익명',
      eligible_books: eligible_books.length,
      total_value: totalRewardValue,
      delivery_address: finalDeliveryAddress
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        claim_id: rewardClaim.id,
        message: '보상 신청이 완료되었습니다. 관리자 검토 후 연락드리겠습니다.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in claim-reward function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);