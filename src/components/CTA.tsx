import { Button } from "@/components/ui/button";
import { BookOpen, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const CTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartReading = () => {
    if (user) {
      navigate("/books");
    } else {
      navigate("/auth");
    }
  };

  const handleAddBook = () => {
    if (user) {
      navigate("/add-book");
    } else {
      navigate("/auth");
    }
  };

  return (
    <section className="py-20 bg-gradient-to-r from-primary via-warm-orange to-primary">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            옆집 이웃과 함께 시작해보세요!
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            가까운 이웃과 함께 만들어가는 따뜻한 독서 문화,<br />
            옆집책꽂이에서 새로운 책과 새로운 이웃을 만나보세요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartReading}
              size="lg" 
              className="text-lg px-8 bg-white text-primary hover:bg-white/90 transform hover:scale-105"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              책 둘러보기
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              onClick={handleAddBook}
              size="lg" 
              className="text-lg px-8 bg-white text-primary hover:bg-white/90 transform hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              첫 번째 책 등록
            </Button>
          </div>
          
          <div className="mt-12 text-white/80">
            <p className="text-sm">
              🏠 우리 동네부터 시작하는 책 나눔 문화
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;