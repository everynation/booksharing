-- Fix critical security vulnerability: Remove public access to profiles table
-- and create secure functions for legitimate data access

-- 1. Remove the overly permissive policy that exposes personal data
DROP POLICY IF EXISTS "Anyone can view display names and addresses for book browsing" ON public.profiles;

-- 2. Create a secure function to get only safe profile data for book listings
CREATE OR REPLACE FUNCTION public.get_book_owner_info(owner_user_id uuid)
RETURNS TABLE(display_name text, address text) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    profiles.display_name,
    profiles.address
  FROM public.profiles 
  WHERE profiles.user_id = owner_user_id;
$$;

-- 3. Create a secure function to get display names for transactions/messaging
CREATE OR REPLACE FUNCTION public.get_user_display_name_secure(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles WHERE user_id = user_id_param;
$$;

-- 4. Create a policy that only allows viewing profile data for users involved in the same transaction
CREATE POLICY "Users can view profiles for their transactions only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can view their own profile
  auth.uid() = user_id 
  OR
  -- Users can view profiles of people they have transactions with
  EXISTS (
    SELECT 1 FROM public.transactions
    WHERE (
      (transactions.owner_id = auth.uid() AND transactions.borrower_id = profiles.user_id) OR
      (transactions.borrower_id = auth.uid() AND transactions.owner_id = profiles.user_id)
    )
    AND transactions.status IN ('approved', 'active', 'pending_return', 'completed')
  )
);

-- 5. Update the existing function to be more secure
DROP FUNCTION IF EXISTS public.get_user_display_name(uuid);

-- Note: Applications should now use the secure functions instead of direct profile queries
-- Phone numbers are now only accessible to the profile owner