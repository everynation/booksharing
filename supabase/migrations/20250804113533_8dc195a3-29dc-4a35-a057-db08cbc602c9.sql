-- Create reviews table for book reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create function to check if user can write review for this book
CREATE OR REPLACE FUNCTION public.can_user_review_book(book_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN := FALSE;
  has_transaction BOOLEAN := FALSE;
BEGIN
  -- Check if user owns the book
  SELECT EXISTS(
    SELECT 1 FROM public.books 
    WHERE id = book_id_param AND user_id = user_id_param
  ) INTO is_owner;
  
  -- Check if user has any transaction with this book (bought, borrowed, or returned)
  SELECT EXISTS(
    SELECT 1 FROM public.transactions 
    WHERE book_id = book_id_param 
    AND (borrower_id = user_id_param OR owner_id = user_id_param)
    AND status IN ('approved', 'completed')
  ) INTO has_transaction;
  
  RETURN (is_owner OR has_transaction);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for eligible books" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_user_review_book(book_id, user_id)
);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();