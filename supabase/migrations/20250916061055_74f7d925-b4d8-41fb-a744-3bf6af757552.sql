-- Check if any missing tables or columns need to be added for the book sharing features

-- Ensure all necessary columns exist in the transactions table
DO $$
BEGIN
  -- Add any missing columns to transactions table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'total_amount') THEN
    ALTER TABLE public.transactions ADD COLUMN total_amount INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'type') THEN
    ALTER TABLE public.transactions ADD COLUMN type TEXT DEFAULT 'rental';
  END IF;
END $$;

-- Ensure rental_handshakes table has proper structure
CREATE TABLE IF NOT EXISTS public.rental_handshakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL,
  borrower_confirmed BOOLEAN DEFAULT FALSE,
  owner_confirmed BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rental_handshakes if not already enabled
ALTER TABLE public.rental_handshakes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rental_handshakes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rental_handshakes' 
    AND policyname = 'Users can view handshakes for their transactions'
  ) THEN
    CREATE POLICY "Users can view handshakes for their transactions" 
    ON public.rental_handshakes 
    FOR SELECT 
    USING (EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = rental_handshakes.transaction_id 
      AND (transactions.owner_id = auth.uid() OR transactions.borrower_id = auth.uid())
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rental_handshakes' 
    AND policyname = 'Users can update handshakes for their transactions'
  ) THEN
    CREATE POLICY "Users can update handshakes for their transactions" 
    ON public.rental_handshakes 
    FOR UPDATE 
    USING (EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE transactions.id = rental_handshakes.transaction_id 
      AND (transactions.owner_id = auth.uid() OR transactions.borrower_id = auth.uid())
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rental_handshakes' 
    AND policyname = 'System can insert handshakes'
  ) THEN
    CREATE POLICY "System can insert handshakes" 
    ON public.rental_handshakes 
    FOR INSERT 
    WITH CHECK (true);
  END IF;
END $$;

-- Add trigger for updated_at on rental_handshakes
CREATE OR REPLACE TRIGGER update_rental_handshakes_updated_at
  BEFORE UPDATE ON public.rental_handshakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure reviews table has proper structure
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Anyone can view reviews'
  ) THEN
    CREATE POLICY "Anyone can view reviews" 
    ON public.reviews 
    FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can create reviews for eligible books'
  ) THEN
    CREATE POLICY "Users can create reviews for eligible books" 
    ON public.reviews 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND can_user_review_book(book_id, user_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can update their own reviews'
  ) THEN
    CREATE POLICY "Users can update their own reviews" 
    ON public.reviews 
    FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'reviews' 
    AND policyname = 'Users can delete their own reviews'
  ) THEN
    CREATE POLICY "Users can delete their own reviews" 
    ON public.reviews 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add trigger for updated_at on reviews
CREATE OR REPLACE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();