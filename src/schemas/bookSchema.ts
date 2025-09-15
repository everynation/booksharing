import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하로 입력해주세요'),
  
  author: z.string()
    .min(1, '저자를 입력해주세요')
    .max(100, '저자는 100자 이하로 입력해주세요'),
  
  isbn: z.string()
    .optional()
    .refine((val) => !val || /^\d{10}(\d{3})?$/.test(val.replace(/-/g, '')), 
      'ISBN은 10자리 또는 13자리 숫자여야 합니다'),
  
  transaction_type: z.enum(['sale', 'rental'], {
    message: '거래 유형을 선택해주세요',
  }),
  
  price: z.number()
    .min(0, '가격은 0원 이상이어야 합니다')
    .max(1000000, '가격은 100만원 이하로 입력해주세요'),
  
  description: z.string()
    .max(1000, '설명은 1000자 이하로 입력해주세요')
    .optional(),
  
  rental_daily: z.number()
    .min(0, '일일 대여료는 0원 이상이어야 합니다')
    .optional(),
  
  weekly_rate: z.number()
    .min(0, '주간 대여료는 0원 이상이어야 합니다')
    .optional(),
  
  late_fee_per_day: z.number()
    .min(0, '연체료는 0원 이상이어야 합니다')
    .optional(),
  
  new_book_price: z.number()
    .min(0, '신간 가격은 0원 이상이어야 합니다')
    .optional(),
  
  rental_terms: z.string()
    .max(500, '대여 조건은 500자 이하로 입력해주세요')
    .optional(),
});

export type BookFormData = z.infer<typeof bookSchema>;