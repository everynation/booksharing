-- 기존 데이터 모두 삭제 (외래키 제약조건 고려하여 순서대로)

-- 1. 메시지 데이터 삭제
DELETE FROM public.messages;

-- 2. 리뷰 데이터 삭제  
DELETE FROM public.reviews;

-- 3. 거래 데이터 삭제
DELETE FROM public.transactions;

-- 4. 책 데이터 삭제
DELETE FROM public.books;

-- 5. 프로필 데이터 삭제
DELETE FROM public.profiles;

-- 6. Storage 버킷의 파일들도 정리 (선택적)
-- 책 표지 이미지들과 반납 증명 이미지들이 저장되어 있음