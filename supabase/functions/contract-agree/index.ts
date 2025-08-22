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
    // Create Supabase client with service role for bypassing RLS when needed
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const url = new URL(req.url);
    const contractId = url.pathname.split('/').pop();

    // Get current contract
    const { data: contract, error: contractError } = await supabaseClient
      .from('rental_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== 'PENDING') {
      throw new Error("Contract is not in pending status");
    }

    // Check if user is party to the contract
    if (user.id !== contract.owner_id && user.id !== contract.borrower_id) {
      throw new Error("Not authorized to modify this contract");
    }

    // Determine which field to update
    const isOwner = user.id === contract.owner_id;
    const updateField = isOwner ? 'owner_confirmed' : 'borrower_confirmed';
    
    // Update confirmation
    const updates: any = { [updateField]: true };
    
    // Check if both parties have confirmed
    const bothConfirmed = isOwner 
      ? contract.borrower_confirmed && true
      : contract.owner_confirmed && true;

    if (bothConfirmed) {
      // Both parties confirmed - activate contract
      const now = new Date();
      const nextCharge = new Date(now);
      nextCharge.setUTCDate(nextCharge.getUTCDate() + 1);
      nextCharge.setUTCHours(0, 0, 0, 0); // Set to midnight UTC

      updates.status = 'ACTIVE';
      updates.start_date = now.toISOString();
      updates.next_charge_at = nextCharge.toISOString();
    }

    const { data: updatedContract, error: updateError } = await supabaseService
      .from('rental_contracts')
      .update(updates)
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update contract");
    }

    return new Response(JSON.stringify({ contract: updatedContract }), {
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