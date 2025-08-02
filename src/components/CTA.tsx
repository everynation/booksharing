import { Button } from "@/components/ui/button";
import { BookOpen, Smartphone } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary via-warm-orange to-primary">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 시작해보세요!
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            가까운 이웃과 함께 만들어가는 따뜻한 독서 문화,<br />
            이웃책방에서 새로운 책과 새로운 이웃을 만나보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="soft" size="lg" className="text-lg px-8 bg-white text-primary hover:bg-white/90">
              <BookOpen className="h-5 w-5" />
              책 찾으러 가기
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 border-white text-white hover:bg-white hover:text-primary">
              <Smartphone className="h-5 w-5" />
              앱 다운로드
            </Button>
          </div>
          
          <div className="mt-12 text-white/80">
            <p className="text-sm">
              📱 곧 모바일 앱도 출시 예정입니다
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;