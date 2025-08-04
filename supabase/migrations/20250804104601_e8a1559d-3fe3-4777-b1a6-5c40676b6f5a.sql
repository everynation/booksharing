-- 프로필 테이블 생성
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 책 테이블 생성
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  cover_image_url TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rental')),
  price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'rented', 'sold')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 거래 테이블 생성
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'rental')),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'completed', 'returned')),
  return_proof_url TEXT,
  rental_earnings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 스토리지 버킷 생성 (책 표지 이미지용)
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- 스토리지 버킷 생성 (반납 인증 사진용)
INSERT INTO storage.buckets (id, name, public) VALUES ('return-proofs', 'return-proofs', false);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 프로필 RLS 정책
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 책 RLS 정책
CREATE POLICY "Users can view all available books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Users can insert their own books" ON public.books FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own books" ON public.books FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own books" ON public.books FOR DELETE USING (auth.uid() = owner_id);

-- 거래 RLS 정책
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = borrower_id);
CREATE POLICY "Users can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = borrower_id);
CREATE POLICY "Book owners can update transactions" ON public.transactions FOR UPDATE USING (auth.uid() = owner_id);

-- 스토리지 정책 (책 표지)
CREATE POLICY "Anyone can view book covers" ON storage.objects FOR SELECT USING (bucket_id = 'book-covers');
CREATE POLICY "Users can upload book covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their book covers" ON storage.objects FOR UPDATE USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 스토리지 정책 (반납 인증)
CREATE POLICY "Users can view their return proofs" ON storage.objects FOR SELECT USING (bucket_id = 'return-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload return proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'return-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 타임스탬프 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 타임스탬프 업데이트 트리거
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 사용자 가입 시 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- 사용자 가입 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();