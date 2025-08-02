import { Plus, Search, HandHeart, BookOpen } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Plus,
      title: "책 등록하기",
      description: "다 읽은 책을 앱에 등록해보세요.",
      step: "01"
    },
    {
      icon: Search,
      title: "책 찾기",
      description: "이웃이 공유한 책 중에서 읽고 싶은 책을 검색해보세요.",
      step: "02"
    },
    {
      icon: HandHeart,
      title: "대여 요청",
      description: "원하는 책에 대여를 요청하면 책 주인이 수락하고 책꽂이에 준비해둡니다.",
      step: "03"
    },
    {
      icon: BookOpen,
      title: "책 즐기기",
      description: "하루 100원으로 책을 읽고, 반납 시 사진 인증으로 요금 청구가 중단됩니다.",
      step: "04"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-accent to-secondary">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            어떻게 이용하나요?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            간단한 4단계로 이웃과 책을 나누어보세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-primary/30 z-0"></div>
              )}
              
              <div className="relative bg-white rounded-2xl p-8 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 text-center">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                
                <div className="mt-4 mb-6">
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
      </div>
    </section>
  );
};

export default HowItWorks;