import { BookOpen, MapPin, Heart, Shield, Clock, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: "쉬운 책 등록",
      description: "사진 한 장으로 간단하게 책을 등록하고 이웃과 공유하세요.",
      color: "text-primary"
    },
    {
      icon: MapPin,
      title: "우리 동네 책방",
      description: "가까운 이웃의 책꽂이에서 읽고 싶은 책을 바로 찾아보세요.",
      color: "text-soft-green"
    },
    {
      icon: Heart,
      title: "따뜻한 나눔",
      description: "대여부터 판매까지, 이웃과 함께하는 책 나눔 문화를 만들어가요.",
      color: "text-warm-orange"
    },
    {
      icon: Clock,
      title: "간편한 거래",
      description: "직접 만나서 간단하게 거래하고, 반납 인증으로 안전하게 마무리하세요.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "안전한 시스템",
      description: "사용자 검증과 거래 내역 관리로 믿을 수 있는 책 공유 환경을 제공합니다.",
      color: "text-book-brown"
    },
    {
      icon: Gift,
      title: "보상 시스템",
      description: "책 대여 수익이 원가를 넘으면 새로운 책을 보상으로 받을 수 있어요.",
      color: "text-soft-green"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            옆집책꽂이가 특별한 이유
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            단순한 책 대여를 넘어, 이웃과 함께 만들어가는 새로운 독서 문화입니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 bg-card group">
              <CardContent className="p-8">
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className={`h-12 w-12 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;