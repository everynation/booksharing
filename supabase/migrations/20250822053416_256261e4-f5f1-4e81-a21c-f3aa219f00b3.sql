-- Add columns to books table for sale/rental support
ALTER TABLE public.books 
ADD COLUMN for_sale BOOLEAN DEFAULT false,
ADD COLUMN for_rental BOOLEAN DEFAULT false,
ADD COLUMN rental_daily INTEGER DEFAULT 0,
ADD COLUMN rental_weekly INTEGER DEFAULT 0,
ADD COLUMN late_daily INTEGER DEFAULT 0;

-- Update existing books based on transaction_type
UPDATE public.books 
SET for_sale = CASE WHEN transaction_type = 'sale' THEN true ELSE false END,
    for_rental = CASE WHEN transaction_type = 'rental' THEN true ELSE false END,
    rental_daily = CASE WHEN transaction_type = 'rental' THEN daily_rate ELSE 0 END,
    rental_weekly = CASE WHEN transaction_type = 'rental' THEN weekly_rate ELSE 0 END,
    late_daily = CASE WHEN transaction_type = 'rental' THEN late_fee_per_day ELSE 0 END;

-- Add type column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN type TEXT DEFAULT 'rental' CHECK (type IN ('sale', 'rental'));

-- Update existing transactions based on book transaction_type
UPDATE public.transactions 
SET type = (
  SELECT CASE WHEN books.transaction_type = 'sale' THEN 'sale' ELSE 'rental' END
  FROM books 
  WHERE books.id = transactions.book_id
);

-- Create RentalHandshake table
CREATE TABLE public.rental_handshakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  owner_confirmed BOOLEAN DEFAULT false,
  borrower_confirmed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for rental_handshakes
ALTER TABLE public.rental_handshakes ENABLE ROW LEVEL SECURITY;

-- Create policies for rental_handshakes
CREATE POLICY "Users can view handshakes for their transactions" 
ON public.rental_handshakes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = rental_handshakes.transaction_id 
    AND (transactions.owner_id = auth.uid() OR transactions.borrower_id = auth.uid())
  )
);

CREATE POLICY "Users can update handshakes for their transactions" 
ON public.rental_handshakes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = rental_handshakes.transaction_id 
    AND (transactions.owner_id = auth.uid() OR transactions.borrower_id = auth.uid())
  )
);

CREATE POLICY "System can insert handshakes" 
ON public.rental_handshakes 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updating updated_at
CREATE TRIGGER update_rental_handshakes_updated_at
  BEFORE UPDATE ON public.rental_handshakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();