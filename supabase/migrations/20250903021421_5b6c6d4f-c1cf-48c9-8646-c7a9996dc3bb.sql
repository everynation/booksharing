-- Create reward_claims table for tracking book reward claims
CREATE TABLE public.reward_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  eligible_books JSONB NOT NULL, -- Store array of eligible book data
  total_reward_value INTEGER NOT NULL DEFAULT 0,
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, shipped, delivered, rejected
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;

-- Create policies for reward_claims
CREATE POLICY "Users can view their own reward claims" 
ON public.reward_claims 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reward claims" 
ON public.reward_claims 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reward claims" 
ON public.reward_claims 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reward_claims_updated_at
BEFORE UPDATE ON public.reward_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create transaction_cancellations table for tracking cancellation requests
CREATE TABLE public.transaction_cancellations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  requestor_id UUID NOT NULL, -- user who requested cancellation
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_cancellations ENABLE ROW LEVEL SECURITY;

-- Create policies for transaction_cancellations
CREATE POLICY "Users can view their transaction cancellations" 
ON public.transaction_cancellations 
FOR SELECT 
USING (auth.uid() = requestor_id OR EXISTS (
  SELECT 1 FROM public.transactions t 
  WHERE t.id = transaction_cancellations.transaction_id 
  AND (t.owner_id = auth.uid() OR t.borrower_id = auth.uid())
));

CREATE POLICY "Users can create transaction cancellations" 
ON public.transaction_cancellations 
FOR INSERT 
WITH CHECK (auth.uid() = requestor_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transaction_cancellations_updated_at
BEFORE UPDATE ON public.transaction_cancellations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();