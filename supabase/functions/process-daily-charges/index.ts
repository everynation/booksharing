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
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Starting daily charge processing...");

    // Get contracts that are due for charging
    const now = new Date();
    const { data: dueContracts, error: contractsError } = await supabaseService
      .from('rental_contracts')
      .select('*')
      .in('status', ['ACTIVE', 'RETURN_PENDING'])
      .lte('next_charge_at', now.toISOString());

    if (contractsError) {
      console.error("Error fetching due contracts:", contractsError);
      throw new Error("Failed to fetch due contracts");
    }

    console.log(`Found ${dueContracts?.length || 0} contracts due for charging`);

    if (!dueContracts || dueContracts.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No contracts due for charging",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const contract of dueContracts) {
      try {
        // Determine charge amount
        const isReturnPending = contract.status === 'RETURN_PENDING';
        const chargeAmount = isReturnPending 
          ? (contract.late_daily_price || contract.daily_price)
          : contract.daily_price;

        // Calculate actual charge (don't exceed cap)
        const remainingCap = contract.new_book_price_cap - contract.total_charged;
        const actualCharge = Math.min(chargeAmount, remainingCap);

        if (actualCharge <= 0) {
          // Already at cap, force close
          await supabaseService
            .from('rental_contracts')
            .update({
              status: 'FORCE_CLOSED',
              end_date: now.toISOString()
            })
            .eq('id', contract.id);
          
          console.log(`Contract ${contract.id} force closed - cap reached`);
          processedCount++;
          continue;
        }

        // Get borrower's wallet
        const { data: borrowerWallet, error: walletError } = await supabaseService
          .from('wallets')
          .select('*')
          .eq('user_id', contract.borrower_id)
          .single();

        if (walletError || !borrowerWallet) {
          console.error(`Borrower wallet not found for contract ${contract.id}`);
          errorCount++;
          continue;
        }

        if (borrowerWallet.balance < actualCharge) {
          console.log(`Insufficient balance for contract ${contract.id}`);
          // TODO: Send notification about insufficient balance
          errorCount++;
          continue;
        }

        // Get or create owner's wallet
        let { data: ownerWallet, error: ownerWalletError } = await supabaseService
          .from('wallets')
          .select('*')
          .eq('user_id', contract.owner_id)
          .single();

        if (ownerWalletError || !ownerWallet) {
          // Create owner wallet if it doesn't exist
          const { data: newWallet, error: createError } = await supabaseService
            .from('wallets')
            .insert({ user_id: contract.owner_id, balance: 0 })
            .select()
            .single();

          if (createError) {
            console.error(`Failed to create owner wallet for contract ${contract.id}`);
            errorCount++;
            continue;
          }
          ownerWallet = newWallet;
        }

        // Process the transaction
        const newBorrowerBalance = borrowerWallet.balance - actualCharge;
        const newOwnerBalance = ownerWallet.balance + actualCharge;
        const newTotalCharged = contract.total_charged + actualCharge;

        // Calculate next charge date
        const nextCharge = new Date(contract.next_charge_at);
        nextCharge.setUTCDate(nextCharge.getUTCDate() + 1);

        // Update wallets and contract in a transaction-like manner
        const { error: borrowerUpdateError } = await supabaseService
          .from('wallets')
          .update({ balance: newBorrowerBalance })
          .eq('id', borrowerWallet.id);

        if (borrowerUpdateError) {
          console.error(`Failed to update borrower wallet for contract ${contract.id}`);
          errorCount++;
          continue;
        }

        const { error: ownerUpdateError } = await supabaseService
          .from('wallets')
          .update({ balance: newOwnerBalance })
          .eq('id', ownerWallet.id);

        if (ownerUpdateError) {
          console.error(`Failed to update owner wallet for contract ${contract.id}`);
          errorCount++;
          continue;
        }

        // Record wallet transactions
        await supabaseService.from('wallet_transactions').insert([
          {
            user_id: contract.borrower_id,
            amount: -actualCharge,
            transaction_type: 'rental_payment',
            description: `Daily rental payment for contract ${contract.id}`,
            transaction_id: contract.id
          },
          {
            user_id: contract.owner_id,
            amount: actualCharge,
            transaction_type: 'rental_income',
            description: `Daily rental income from contract ${contract.id}`,
            transaction_id: contract.id
          }
        ]);

        // Update contract
        const contractUpdates: any = {
          total_charged: newTotalCharged,
          next_charge_at: nextCharge.toISOString()
        };

        // Check if we've reached the cap
        if (newTotalCharged >= contract.new_book_price_cap) {
          contractUpdates.status = 'FORCE_CLOSED';
          contractUpdates.end_date = now.toISOString();
        }

        const { error: contractUpdateError } = await supabaseService
          .from('rental_contracts')
          .update(contractUpdates)
          .eq('id', contract.id);

        if (contractUpdateError) {
          console.error(`Failed to update contract ${contract.id}`);
          errorCount++;
          continue;
        }

        console.log(`Successfully processed charge for contract ${contract.id}: ${actualCharge}`);
        processedCount++;

      } catch (error) {
        console.error(`Error processing contract ${contract.id}:`, error);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({ 
      message: `Processed ${processedCount} contracts, ${errorCount} errors`,
      processed: processedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-daily-charges:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});