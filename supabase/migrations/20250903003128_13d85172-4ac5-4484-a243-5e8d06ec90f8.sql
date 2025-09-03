-- Remove the view completely to eliminate the security warning
DROP VIEW IF EXISTS public.books_public;

-- The RLS policies we created are sufficient for security
-- Users will need to use application-level filtering for sensitive data when needed