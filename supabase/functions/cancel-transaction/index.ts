import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelTransactionRequest {
  transaction_id: string;
  reason?: string;
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

    const { transaction_id, reason }: CancelTransactionRequest = await req.json();

    if (!transaction_id) {
      throw new Error('Transaction ID is required');
    }

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (transactionError || !transaction) {
      throw new Error('Transaction not found');
    }

    // Check if user is involved in the transaction
    if (transaction.borrower_id !== user.id && transaction.owner_id !== user.id) {
      throw new Error('You are not authorized to cancel this transaction');
    }

    // Check if transaction can be cancelled
    if (!['requested', 'in_progress'].includes(transaction.status)) {
      throw new Error('This transaction cannot be cancelled at this stage');
    }

    // Create cancellation request
    const { data: cancellation, error: cancellationError } = await supabase
      .from('transaction_cancellations')
      .insert({
        transaction_id,
        requestor_id: user.id,
        reason: reason || '사용자 요청',
        status: 'pending'
      })
      .select()
      .single();

    if (cancellationError) {
      console.error('Error creating cancellation request:', cancellationError);
      throw new Error('Failed to create cancellation request');
    }

    // Update transaction status to indicate cancellation is pending
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'cancellation_pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('Error updating transaction status:', updateError);
    }

    // Log the cancellation request
    console.log('Transaction cancellation requested:', {
      cancellation_id: cancellation.id,
      transaction_id,
      requestor_id: user.id,
      reason: reason || '사용자 요청'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        cancellation_id: cancellation.id,
        message: '거래 취소 요청이 완료되었습니다. 상대방에게 알림이 전송됩니다.'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in cancel-transaction function:', error);
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