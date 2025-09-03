-- Fix security issue: Restrict profiles table to prevent sensitive personal information theft

-- Drop existing overly permissive policies that expose sensitive data
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

-- Now the profiles table is completely locked down to only own profiles
-- Users can ONLY see their own complete profile data
-- For transaction partners, they must use the secure function above
-- This prevents any access to sensitive data like phone numbers and addresses

-- No additional policies needed - the existing "Users can view their own profile" policy
-- is sufficient for security. All other access is blocked.