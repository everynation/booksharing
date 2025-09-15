-- Create function to safely increment wallet balance
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  user_id_param uuid,
  amount_param integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert wallet if it doesn't exist, or update balance if it does
  INSERT INTO public.wallets (user_id, balance)
  VALUES (user_id_param, amount_param)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = wallets.balance + amount_param,
    updated_at = now();
END;
$$;