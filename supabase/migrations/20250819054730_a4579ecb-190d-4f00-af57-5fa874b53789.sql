-- Add new columns to books table for rental pricing
ALTER TABLE public.books 
ADD COLUMN daily_rate INTEGER DEFAULT 0,
ADD COLUMN weekly_rate INTEGER DEFAULT 0,
ADD COLUMN late_fee_per_day INTEGER DEFAULT 0,
ADD COLUMN rental_terms TEXT DEFAULT '';

-- Add new columns to transactions table for mutual confirmation and return requests
ALTER TABLE public.transactions
ADD COLUMN borrower_confirmed BOOLEAN DEFAULT false,
ADD COLUMN owner_confirmed BOOLEAN DEFAULT false,
ADD COLUMN return_requested_at TIMESTAMPTZ NULL,
ADD COLUMN return_deadline TIMESTAMPTZ NULL,
ADD COLUMN rental_start_date TIMESTAMPTZ NULL,
ADD COLUMN rental_end_date TIMESTAMPTZ NULL,
ADD COLUMN total_amount INTEGER DEFAULT 0;

-- Create wallet table for user balances
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on wallets
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for wallets
CREATE POLICY "Users can view their own wallet" 
ON public.wallets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" 
ON public.wallets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" 
ON public.wallets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create wallet transactions table for transaction history
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'earning')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for wallet_transactions
CREATE POLICY "Users can view their own wallet transactions" 
ON public.wallet_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions" 
ON public.wallet_transactions 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for wallet updated_at
CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update transaction status enum to include new statuses
ALTER TABLE public.transactions 
ADD CONSTRAINT check_transaction_status 
CHECK (status IN ('requested', 'confirmed', 'in_progress', 'return_requested', 'completed', 'cancelled'));