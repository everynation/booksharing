-- profiles 테이블에 좌표 정보 컬럼 추가
ALTER TABLE public.profiles 
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- profiles 테이블에 지역 검색을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (latitude, longitude);
