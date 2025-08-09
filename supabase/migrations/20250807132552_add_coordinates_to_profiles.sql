-- profiles 테이블에 좌표 정보 컬럼 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
    -- latitude 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN latitude DOUBLE PRECISION;
    END IF;
    
    -- longitude 컬럼이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN longitude DOUBLE PRECISION;
    END IF;
END $$;

-- profiles 테이블에 지역 검색을 위한 인덱스 추가 (이미 존재하는 경우 무시)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (latitude, longitude);
