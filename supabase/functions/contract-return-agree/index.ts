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

    if (contract.status !== 'RETURN_PENDING') {
      throw new Error("Contract is not in return pending status");
    }

    // Check if user is party to the contract
    if (user.id !== contract.owner_id && user.id !== contract.borrower_id) {
      throw new Error("Not authorized to modify this contract");
    }

    // Determine which field to update
    const isOwner = user.id === contract.owner_id;
    const updateField = isOwner ? 'owner_return_ok' : 'borrower_return_ok';
    
    // Update return agreement
    const updates: any = { [updateField]: true };
    
    // Check if both parties have agreed to return
    const bothAgreed = isOwner 
      ? contract.borrower_return_ok && true
      : contract.owner_return_ok && true;

    if (bothAgreed) {
      // Both parties agreed - complete return
      updates.status = 'RETURNED';
      updates.end_date = new Date().toISOString();
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