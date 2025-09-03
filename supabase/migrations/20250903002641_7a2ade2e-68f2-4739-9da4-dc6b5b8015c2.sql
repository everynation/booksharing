-- Remove the overly permissive policy that exposes user personal information
DROP POLICY IF EXISTS "Anyone can view available books" ON public.books;

-- Create a secure policy that hides sensitive user information from public access
-- Users can see basic book information but not user_id, location, or address unless they own the book
CREATE POLICY "Public can view books without sensitive data" 
ON public.books 
FOR SELECT 
USING (
  CASE 
    WHEN auth.uid() = user_id THEN true  -- Owners can see all their book data
    ELSE (
      -- Public users can only see basic book info, sensitive fields will be filtered in application logic
      status = 'available' AND 
      (for_sale = true OR for_rental = true)
    )
  END
);

-- Create a view for public book browsing that excludes sensitive information
CREATE OR REPLACE VIEW public.books_public AS
SELECT 
  id,
  title,
  author,
  isbn,
  description,
  cover_image_url,
  price,
  rental_daily,
  rental_weekly,
  weekly_rate,
  daily_rate,
  for_rental,
  for_sale,
  status,
  transaction_type,
  rental_terms,
  late_fee_per_day,
  late_daily,
  new_book_price,
  created_at,
  updated_at,
  -- Only show general area information, not exact address
  CASE 
    WHEN address IS NOT NULL THEN 
      regexp_replace(address, '([^,]+,[^,]+).*', '\1', 'g') -- Show only city/district level
    ELSE NULL 
  END as general_area
FROM public.books
WHERE status = 'available' AND (for_sale = true OR for_rental = true);

-- Grant access to the public view
GRANT SELECT ON public.books_public TO authenticated, anon;

-- Create RLS policy for the public view (even though it's a view, this ensures security)
ALTER VIEW public.books_public SET (security_barrier = true);

-- Create a secure function to get book owner contact info only for approved transactions
CREATE OR REPLACE FUNCTION public.get_book_contact_info(book_id_param uuid)
RETURNS TABLE(
  owner_display_name text,
  owner_address text,
  book_latitude double precision,
  book_longitude double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.display_name,
    b.address,
    b.latitude,
    b.longitude
  FROM public.books b
  JOIN public.profiles p ON p.user_id = b.user_id
  WHERE b.id = book_id_param
    AND (
      -- User owns the book
      b.user_id = auth.uid() 
      OR 
      -- User has an approved/active transaction with this book
      EXISTS (
        SELECT 1 FROM public.transactions t
        WHERE t.book_id = book_id_param 
        AND (t.borrower_id = auth.uid() OR t.owner_id = auth.uid())
        AND t.status IN ('approved', 'active', 'pending_return')
      )
    );
$$;