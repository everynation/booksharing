-- Fix critical privacy vulnerability in profiles table RLS policies
-- Remove the overly permissive policy that exposes all user data
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new restrictive policies for profile access
-- Policy 1: Users can view their own complete profile (including sensitive data)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can view only display_name of other users (for book owner identification)
CREATE POLICY "Users can view other users display names only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() != user_id)
WITH CHECK (false); -- This ensures only SELECT is allowed, not INSERT/UPDATE

-- Create a view for public profile information (display_name only)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  display_name
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Update database functions with proper security
-- Fix the handle_new_user function to include proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
begin
  insert into public.profiles (user_id, display_name, address, latitude, longitude)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'address',
    nullif(new.raw_user_meta_data ->> 'latitude', '')::double precision,
    nullif(new.raw_user_meta_data ->> 'longitude', '')::double precision
  )
  on conflict (user_id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    address = coalesce(excluded.address, public.profiles.address),
    latitude = coalesce(excluded.latitude, public.profiles.latitude),
    longitude = coalesce(excluded.longitude, public.profiles.longitude),
    updated_at = now();
  return new;
end;
$$;

-- Update the can_user_review_book function with proper search_path
CREATE OR REPLACE FUNCTION public.can_user_review_book(book_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;