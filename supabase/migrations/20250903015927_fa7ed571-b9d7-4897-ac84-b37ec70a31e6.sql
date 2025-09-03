-- Fix security issue: Restrict profiles table to prevent sensitive personal information theft

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view basic profile data for active transactions" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles for their transactions only" ON public.profiles;

-- Create a secure function to get only safe profile data for transaction partners
CREATE OR REPLACE FUNCTION public.get_safe_profile_for_transaction(profile_user_id uuid, requesting_user_id uuid)
RETURNS TABLE(
  display_name text,
  avatar_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.display_name,
    p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = profile_user_id
    AND EXISTS (
      SELECT 1 
      FROM public.transactions t
      WHERE ((t.owner_id = requesting_user_id AND t.borrower_id = profile_user_id) 
             OR (t.borrower_id = requesting_user_id AND t.owner_id = profile_user_id))
        AND t.status IN ('approved', 'active', 'pending_return', 'completed', 'requested')
    );
$$;

-- Create a more restrictive policy that only allows viewing minimal data during active transactions
-- This policy ensures that sensitive data like phone and address are NEVER exposed to transaction partners
CREATE POLICY "Users can view safe profile data for transactions" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (
    auth.uid() IS NOT NULL 
    AND EXISTS (
      SELECT 1 
      FROM public.transactions t
      WHERE ((t.owner_id = auth.uid() AND t.borrower_id = profiles.user_id) 
             OR (t.borrower_id = auth.uid() AND t.owner_id = profiles.user_id))
        AND t.status IN ('approved', 'active', 'pending_return', 'completed', 'requested')
    )
  )
);

-- However, the above policy still exposes all columns. We need to be more specific.
-- Let's drop it and create a function-based approach instead
DROP POLICY IF EXISTS "Users can view safe profile data for transactions" ON public.profiles;

-- Create a more secure policy that restricts column access
-- Users can only see their own complete profile
-- For others, they get no direct access and must use the secure function
CREATE POLICY "Strict profile access - own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a view that provides safe public profile data
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Create RLS policies for the safe view
CREATE POLICY "Anyone can view safe profile data" 
ON public.safe_profiles
FOR SELECT 
USING (true);