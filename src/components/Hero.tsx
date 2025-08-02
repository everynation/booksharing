import { Button } from "@/components/ui/button";
import { BookOpen, Users, Heart } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream via-background to-accent py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                이웃과 함께하는
                <br />
                <span className="text-primary">이웃책꽂이</span>
              </h1>
               <p className="text-xl text-muted-foreground leading-relaxed">
                이웃책꽂이 전용 책꽂이로 시작되는<br />
                하루 100원의 따뜻한 책 나눔 문화
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="warm" size="lg" className="text-lg px-8">
                <BookOpen className="h-5 w-5" />
                책 찾아보기
              </Button>
              <Button variant="soft" size="lg" className="text-lg px-8">
                <Users className="h-5 w-5" />
                이웃과 연결하기
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1,234</div>
                <div className="text-sm text-muted-foreground">공유된 책</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">567</div>
                <div className="text-sm text-muted-foreground">활성 이웃</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">89</div>
                <div className="text-sm text-muted-foreground">이웃책꽂이</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="이웃책꽂이 - 이웃과 함께하는 책 공유" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* 떠다니는 카드들 */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 hidden lg:block">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">새로운 독후감</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 hidden lg:block">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">책 대여 완료</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;