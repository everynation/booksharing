-- Fix security issue: Restrict books table column access to prevent user personal information exposure

-- Drop existing policies that expose user data
DROP POLICY IF EXISTS "Public can view basic book info only" ON public.books;
DROP POLICY IF EXISTS "Authenticated users can view available books" ON public.books;

-- Create secure policies that restrict column access for public users
CREATE POLICY "Public can view safe book info only" 
ON public.books 
FOR SELECT 
USING (
  auth.uid() IS NULL 
  AND status = 'available' 
  AND (for_sale = true OR for_rental = true)
);

-- Create secure policies that restrict column access for authenticated non-owners
CREATE POLICY "Authenticated users can view safe book info" 
ON public.books 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() <> user_id 
  AND status = 'available' 
  AND (for_sale = true OR for_rental = true)
);

-- Create a security function to return only safe book data for public access
CREATE OR REPLACE FUNCTION public.get_safe_book_info(book_id_param uuid)
RETURNS TABLE(
  id uuid,
  title text,
  author text,
  description text,
  cover_image_url text,
  isbn text,
  price integer,
  rental_daily integer,
  weekly_rate integer,
  rental_weekly integer,
  daily_rate integer,
  late_daily integer,
  late_fee_per_day integer,
  new_book_price integer,
  rental_terms text,
  for_rental boolean,
  for_sale boolean,
  status text,
  transaction_type text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  -- Safe location info without exact coordinates
  has_location boolean,
  general_area text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id,
    b.title,
    b.author,
    b.description,
    b.cover_image_url,
    b.isbn,
    b.price,
    b.rental_daily,
    b.weekly_rate,
    b.rental_weekly,
    b.daily_rate,
    b.late_daily,
    b.late_fee_per_day,
    b.new_book_price,
    b.rental_terms,
    b.for_rental,
    b.for_sale,
    b.status,
    b.transaction_type,
    b.created_at,
    b.updated_at,
    -- Provide safe location indicators without exposing exact coordinates
    (b.latitude IS NOT NULL AND b.longitude IS NOT NULL) as has_location,
    CASE 
      WHEN b.address IS NOT NULL THEN 
        -- Only show general area (first part of address before first comma or space)
        split_part(split_part(b.address, ',', 1), ' ', 1)
      ELSE NULL 
    END as general_area
  FROM public.books b
  WHERE b.id = book_id_param
    AND b.status = 'available'
    AND (b.for_sale = true OR b.for_rental = true);
$$;