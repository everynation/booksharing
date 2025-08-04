import { ArrowRight, BookOpen, Users, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate("/books");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-warm-orange/10 via-background to-soft-green/10"></div>
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="text-foreground">옆집의</span>{" "}
                <span className="bg-gradient-to-r from-warm-orange to-primary bg-clip-text text-transparent">
                  책꽂이
                </span>
                <br />
                <span className="text-foreground">공유하세요</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                가까운 이웃과 책을 나누고, 새로운 이야기를 발견하세요. 
                간단한 대여부터 판매까지, 우리 동네만의 특별한 도서관을 만들어보세요.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-warm-orange to-primary hover:shadow-warm transform hover:scale-105"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                {user ? "책 둘러보기" : "시작하기"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => user ? navigate("/add-book") : navigate("/auth")}
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Heart className="h-5 w-5 mr-2" />
                + 첫번째 책 등록
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">공유된 책</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100+</div>
                <div className="text-sm text-muted-foreground">활성 이웃</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">완료된 거래</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/20 to-warm-orange/20 rounded-3xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                {/* Book cards simulation */}
                <div className="space-y-4">
                  <div className="bg-background/80 backdrop-blur rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="w-full h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded mb-3"></div>
                    <div className="text-sm font-medium">미드나잇 라이브러리</div>
                    <div className="text-xs text-muted-foreground">매트 헤이그</div>
                    <div className="text-xs text-primary font-medium mt-1">100원/일</div>
                  </div>
                  
                  <div className="bg-background/80 backdrop-blur rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="w-full h-20 bg-gradient-to-br from-green-400 to-green-600 rounded mb-3"></div>
                    <div className="text-sm font-medium">아토믹 해빗</div>
                    <div className="text-xs text-muted-foreground">제임스 클리어</div>
                    <div className="text-xs text-primary font-medium mt-1">100원/일</div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="bg-background/80 backdrop-blur rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="w-full h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded mb-3"></div>
                    <div className="text-sm font-medium">코스모스</div>
                    <div className="text-xs text-muted-foreground">칼 세이건</div>
                    <div className="text-xs text-primary font-medium mt-1">100원/일</div>
                  </div>
                  
                  <div className="bg-background/80 backdrop-blur rounded-xl p-4 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="w-full h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded mb-3"></div>
                    <div className="text-sm font-medium">데미안</div>
                    <div className="text-xs text-muted-foreground">헤르만 헤세</div>
                    <div className="text-xs text-primary font-medium mt-1">100원/일</div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-warm-orange text-white p-3 rounded-full shadow-lg animate-bounce">
                <Users className="h-6 w-6" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-primary text-white p-3 rounded-full shadow-lg animate-pulse">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;