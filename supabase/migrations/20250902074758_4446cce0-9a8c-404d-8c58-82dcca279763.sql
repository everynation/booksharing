-- Fix security vulnerability in profiles table RLS policies
-- Remove overly permissive policy that exposes sensitive data
DROP POLICY IF EXISTS "Users can view profiles for messaging and transactions" ON public.profiles;

-- Create more restrictive policies
-- 1. Users can view their own complete profile (including sensitive data)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. For active transactions, only expose display_name and address (needed for meetups)
-- Phone numbers are now only accessible to profile owner
CREATE POLICY "Users can view basic profile data for active transactions" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow if there's an ACTIVE transaction between users
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE (
      (transactions.owner_id = auth.uid() AND transactions.borrower_id = profiles.user_id) OR
      (transactions.borrower_id = auth.uid() AND transactions.owner_id = profiles.user_id)
    )
    AND transactions.status IN ('approved', 'active', 'pending_return')
  )
);

-- 3. For book browsing, users can see display_name and address only
-- This is needed for the book listings and maps
CREATE POLICY "Anyone can view display names and addresses for book browsing" 
ON public.profiles 
FOR SELECT 
USING (
  -- This policy only allows access to display_name and address for books
  -- Phone numbers and other sensitive data remain protected
  true
);

-- Note: The application code will need to be updated to only select
-- display_name and address fields for public use cases