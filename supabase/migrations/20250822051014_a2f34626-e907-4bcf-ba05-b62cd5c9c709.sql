-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows viewing display_name for users involved in transactions or messages
CREATE POLICY "Users can view profiles for messaging and transactions" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE (owner_id = auth.uid() AND borrower_id = profiles.user_id) 
       OR (borrower_id = auth.uid() AND owner_id = profiles.user_id)
  ) OR
  EXISTS (
    SELECT 1 FROM public.messages 
    WHERE (sender_id = auth.uid() AND receiver_id = profiles.user_id) 
       OR (receiver_id = auth.uid() AND sender_id = profiles.user_id)
  )
);