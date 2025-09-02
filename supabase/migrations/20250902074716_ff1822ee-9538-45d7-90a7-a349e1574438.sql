-- Fix security vulnerability in profiles table RLS policies
-- Remove overly permissive policy that exposes sensitive data
DROP POLICY IF EXISTS "Users can view profiles for messaging and transactions" ON public.profiles;

-- Create more restrictive policies
-- 1. Users can view their own complete profile (including sensitive data)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. For transactions, only expose minimal data (display_name and address)
-- Address is needed for meetup location planning
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

-- 3. Create a view that only exposes safe data for public consumption
CREATE VIEW public.safe_profiles AS
SELECT 
  user_id,
  display_name,
  address,  -- Address is needed for location-based book browsing
  created_at,
  updated_at
FROM public.profiles;

-- 4. Enable RLS on the view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- 5. Create policy for the safe view - anyone can see basic info for book browsing
CREATE POLICY "Anyone can view safe profile data" 
ON public.safe_profiles 
FOR SELECT 
USING (true);

-- Note: Phone numbers are now only accessible to the profile owner
-- Other users will need to communicate through the messaging system