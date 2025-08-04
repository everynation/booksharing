import { Plus, Search, HandHeart, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Plus,
      title: "책 등록하기",
      description: "가지고 있는 책을 사진과 함께 등록하고 대여 또는 판매 가격을 설정하세요.",
      step: "01"
    },
    {
      icon: Search,
      title: "책 찾기",
      description: "옆집 이웃들이 공유한 책 중에서 읽고 싶은 책을 검색하고 찾아보세요.",
      step: "02"
    },
    {
      icon: HandHeart,
      title: "거래하기",
      description: "원하는 책에 대여 또는 구매 요청을 하고 직접 만나서 거래하세요.",
      step: "03"
    },
    {
      icon: CheckCircle,
      title: "반납 인증",
      description: "책을 다 읽은 후 반납하면 책 주인이 사진으로 반납을 인증해드립니다.",
      step: "04"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-accent/50 to-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            어떻게 이용하나요?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            간단한 4단계로 옆집 이웃과 책을 나누어보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-primary/30 z-0"></div>
              )}
              
              <div className="relative bg-background rounded-2xl p-8 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 text-center group">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-warm-orange text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform">
                    {step.step}
                  </div>
                </div>
                
                <div className="mt-4 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-12 w-12 text-primary mx-auto" />
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary/10 to-warm-orange/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              지금 바로 시작해보세요!
            </h3>
            <p className="text-muted-foreground mb-6">
              첫 번째 책을 등록하고 옆집 이웃과 함께하는 독서 여행을 시작하세요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;