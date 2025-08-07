-- 1. books 테이블에 위치 정보 컬럼 추가
ALTER TABLE public.books 
ADD COLUMN address TEXT,
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- 2. profiles 테이블에 이미 address 컬럼이 있는지 확인하고 없다면 추가
-- (profiles 테이블에는 이미 address 컬럼이 있음을 확인했으므로 생략)

-- 3. books 테이블에 지역 검색을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_books_location ON public.books (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_books_address ON public.books (address);