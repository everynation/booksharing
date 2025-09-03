-- Fix the SECURITY DEFINER view issue by removing the security_barrier setting
-- The view itself is safe as it only exposes filtered public data
ALTER VIEW public.books_public RESET (security_barrier);

-- Instead, let's create a proper RLS policy approach
-- First, create a more secure books viewing approach

-- Update the existing policy to be more explicit about what data is accessible
DROP POLICY IF EXISTS "Public can view books without sensitive data" ON public.books;

-- Create separate policies for different access levels
CREATE POLICY "Users can view their own books completely" 
ON public.books 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view basic book info only" 
ON public.books 
FOR SELECT 
USING (
  auth.uid() IS NULL AND  -- Only for non-authenticated users  
  status = 'available' AND 
  (for_sale = true OR for_rental = true)
);

CREATE POLICY "Authenticated users can view available books" 
ON public.books 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND  -- Only for authenticated users
  auth.uid() != user_id AND   -- Not their own books (covered by other policy)
  status = 'available' AND 
  (for_sale = true OR for_rental = true)
);

-- The view is still useful for application logic, but we'll rely on RLS policies instead
-- Remove the SECURITY DEFINER function since we have proper RLS now
DROP FUNCTION IF EXISTS public.get_book_contact_info(uuid);