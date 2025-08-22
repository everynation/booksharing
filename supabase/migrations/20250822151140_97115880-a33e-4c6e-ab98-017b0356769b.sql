-- 기존 책들을 대여 가능하도록 업데이트
UPDATE books 
SET 
  for_rental = true,
  rental_daily = COALESCE(rental_daily, 1000),
  new_book_price = COALESCE(new_book_price, 25000)
WHERE for_rental = false;