import { Book, Instagram, Facebook, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-book-brown text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Book className="h-8 w-8 text-warm-orange" />
              <span className="text-2xl font-bold">책마루</span>
            </div>
            <p className="text-white/80 leading-relaxed">
              이웃과 책을 나누는<br />
              따뜻한 공유 도서관
            </p>
            <div className="flex gap-4">
              <Instagram className="h-5 w-5 text-white/60 hover:text-warm-orange cursor-pointer transition-colors" />
              <Facebook className="h-5 w-5 text-white/60 hover:text-warm-orange cursor-pointer transition-colors" />
              <Twitter className="h-5 w-5 text-white/60 hover:text-warm-orange cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">서비스</h3>
            <ul className="space-y-2 text-white/80">
              <li><a href="/books" className="hover:text-warm-orange transition-colors">책 찾기</a></li>
              <li><a href="/register" className="hover:text-warm-orange transition-colors">책 등록</a></li>
              <li><a href="/community" className="hover:text-warm-orange transition-colors">독후감</a></li>
              <li><a href="/my" className="hover:text-warm-orange transition-colors">내 책장</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">고객지원</h3>
            <ul className="space-y-2 text-white/80">
              <li><a href="/faq" className="hover:text-warm-orange transition-colors">자주 묻는 질문</a></li>
              <li><a href="/guide" className="hover:text-warm-orange transition-colors">이용 가이드</a></li>
              <li><a href="/contact" className="hover:text-warm-orange transition-colors">문의하기</a></li>
              <li><a href="/safety" className="hover:text-warm-orange transition-colors">안전 가이드</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">회사</h3>
            <ul className="space-y-2 text-white/80">
              <li><a href="/about" className="hover:text-warm-orange transition-colors">회사 소개</a></li>
              <li><a href="/terms" className="hover:text-warm-orange transition-colors">이용약관</a></li>
              <li><a href="/privacy" className="hover:text-warm-orange transition-colors">개인정보처리방침</a></li>
              <li><a href="/careers" className="hover:text-warm-orange transition-colors">채용</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-white/60">
          <p>&copy; 2024 책마루. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;