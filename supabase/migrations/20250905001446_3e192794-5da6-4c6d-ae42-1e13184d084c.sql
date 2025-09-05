-- Add latitude and longitude to profiles table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN latitude double precision;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN longitude double precision;
    END IF;
END $$;

-- Update books table to ensure latitude and longitude columns exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.books ADD COLUMN latitude double precision;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.books ADD COLUMN longitude double precision;
    END IF;
END $$;

-- Create function to safely get book locations for map display
CREATE OR REPLACE FUNCTION public.get_books_for_map(
  user_latitude double precision DEFAULT NULL,
  user_longitude double precision DEFAULT NULL,
  max_distance_km integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  latitude double precision,
  longitude double precision,
  price integer,
  transaction_type text,
  general_area text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.title,
    b.latitude,
    b.longitude,
    b.price,
    b.transaction_type,
    CASE 
      WHEN b.address IS NOT NULL THEN 
        split_part(split_part(b.address, ',', 1), ' ', 1)
      ELSE '위치 정보 없음' 
    END as general_area
  FROM public.books b
  WHERE b.status = 'available'
    AND (b.for_sale = true OR b.for_rental = true)
    AND b.latitude IS NOT NULL 
    AND b.longitude IS NOT NULL
    AND (
      user_latitude IS NULL 
      OR user_longitude IS NULL 
      OR (
        6371 * acos(
          cos(radians(user_latitude)) * 
          cos(radians(b.latitude)) * 
          cos(radians(b.longitude) - radians(user_longitude)) + 
          sin(radians(user_latitude)) * 
          sin(radians(b.latitude))
        ) <= max_distance_km
      )
    );
END;
$$;