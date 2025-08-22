-- Add new_book_price field to books table
ALTER TABLE public.books ADD COLUMN new_book_price integer;

-- Create rental_contracts table
CREATE TABLE public.rental_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  borrower_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  daily_price integer NOT NULL,
  late_daily_price integer,
  new_book_price_cap integer NOT NULL,
  start_date timestamptz,
  end_date timestamptz,
  next_charge_at timestamptz,
  total_charged integer NOT NULL DEFAULT 0,
  borrower_confirmed boolean NOT NULL DEFAULT false,
  owner_confirmed boolean NOT NULL DEFAULT false,
  borrower_return_ok boolean NOT NULL DEFAULT false,
  owner_return_ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on rental_contracts
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for rental_contracts
CREATE POLICY "Users can view their own contracts" ON public.rental_contracts
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = borrower_id);

CREATE POLICY "Users can insert contracts as borrower" ON public.rental_contracts
  FOR INSERT
  WITH CHECK (auth.uid() = borrower_id);

CREATE POLICY "Contract parties can update their contracts" ON public.rental_contracts
  FOR UPDATE
  USING (auth.uid() = owner_id OR auth.uid() = borrower_id);

-- Add trigger for updated_at
CREATE TRIGGER update_rental_contracts_updated_at
  BEFORE UPDATE ON public.rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for scheduler queries
CREATE INDEX idx_rental_contracts_next_charge ON public.rental_contracts(next_charge_at, status);