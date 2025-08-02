import { BookOpen, MapPin, MessageCircle, Shield, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: "간편한 책 등록",
      description: "스마트폰으로 책 사진을 찍으면 자동으로 정보가 등록됩니다.",
      color: "text-primary"
    },
    {
      icon: MapPin,
      title: "위치 기반 매칭",
      description: "가까운 이웃의 책마루에서 원하는 책을 쉽게 찾을 수 있어요.",
      color: "text-soft-green"
    },
    {
      icon: Clock,
      title: "약속 시간 설정",
      description: "편리한 시간에 조용히 다녀가며 책을 주고받을 수 있습니다.",
      color: "text-warm-orange"
    },
    {
      icon: MessageCircle,
      title: "독후감 공유",
      description: "읽은 책에 대한 생각을 이웃과 나누며 소통해보세요.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "신뢰 기반 시스템",
      description: "후기와 평점을 통해 안전하고 신뢰할 수 있는 거래를 만들어갑니다.",
      color: "text-book-brown"
    },
    {
      icon: Users,
      title: "커뮤니티 형성",
      description: "책을 통해 이웃과 연결되는 따뜻한 커뮤니티를 만들어가요.",
      color: "text-soft-green"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            책마루가 특별한 이유
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            단순한 책 공유를 넘어, 이웃과 함께 만들어가는 독서 문화입니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-warm transition-all duration-300 hover:-translate-y-1 bg-card">
              <CardContent className="p-8">
                <div className="mb-6">
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