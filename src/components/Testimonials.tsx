import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Testimonials = () => {
  const testimonials = [
    {
      name: "김지혜",
      role: "워킹맘 · 성수동",
      content: "아이들 책을 옆집과 공유하니까 경제적이고, 아이도 더 다양한 책을 읽게 되어서 좋아요. 옆집 아주머니와도 자연스럽게 친해졌어요!",
      rating: 5,
      avatar: "김"
    },
    {
      name: "박민수",
      role: "직장인 · 강남구",
      content: "퇴근 후에도 간편하게 책을 빌릴 수 있어서 정말 편해요. 같은 책을 읽은 이웃분들과 독서 모임도 하게 되었습니다.",
      rating: 5,
      avatar: "박"
    },
    {
      name: "이수진",
      role: "대학생 · 홍대",
      content: "전공서적이 너무 비싸서 고민이었는데, 옆집책꽂이로 선배들 책을 빌려서 공부할 수 있어서 정말 감사해요. 돈도 벌고 책도 읽고!",
      rating: 5,
      avatar: "이"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            옆집 이웃들의 이야기
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            옆집책꽂이를 통해 더 풍부한 독서 생활을 경험하고 있는 이웃들의 진짜 후기입니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-warm transition-all duration-300 bg-card">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-white">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;