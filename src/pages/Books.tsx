import { useState } from "react";
import { Search, MapPin, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";

const Books = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // 임시 책 데이터
  const books = [
    {
      id: 1,
      title: "미드나잇 라이브러리",
      author: "매트 헤이그",
      owner: "김민수",
      distance: "0.2km",
      rating: 4.8,
      price: 100,
      available: true,
      coverImage: "/placeholder.svg",
      description: "무한한 가능성의 도서관에서 펼쳐지는 감동적인 이야기"
    },
    {
      id: 2,
      title: "아토믹 해빗",
      author: "제임스 클리어",
      owner: "이지영",
      distance: "0.5km",
      rating: 4.9,
      price: 100,
      available: true,
      coverImage: "/placeholder.svg",
      description: "작은 습관의 힘으로 인생을 바꾸는 방법"
    },
    {
      id: 3,
      title: "데미안",
      author: "헤르만 헤세",
      owner: "박준호",
      distance: "0.8km",
      rating: 4.7,
      price: 100,
      available: false,
      coverImage: "/placeholder.svg",
      description: "성장과 자아 발견의 고전 소설"
    },
    {
      id: 4,
      title: "코스모스",
      author: "칼 세이건",
      owner: "정수현",
      distance: "1.1km",
      rating: 4.9,
      price: 100,
      available: true,
      coverImage: "/placeholder.svg",
      description: "우주와 과학에 대한 경이로운 여행"
    }
  ];

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* 검색 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            이웃의 책 찾기
          </h1>
          <p className="text-muted-foreground mb-6">
            가까운 이웃이 공유한 책들을 찾아보세요
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="책 제목이나 저자를 검색하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <div className="flex gap-4 mb-6">
          <Button variant="soft" size="sm">
            <MapPin className="h-4 w-4" />
            가까운 순
          </Button>
          <Button variant="ghost" size="sm">
            <Star className="h-4 w-4" />
            평점순
          </Button>
          <Button variant="ghost" size="sm">
            <Clock className="h-4 w-4" />
            최신순
          </Button>
        </div>

        {/* 책 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                <div className="aspect-[3/4] bg-muted relative">
                  <img 
                    src={book.coverImage} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  {!book.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary">대여중</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-2 line-clamp-1">
                  {book.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {book.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{book.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{book.distance}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      소유자: {book.owner}
                    </span>
                    <span className="font-semibold text-primary">
                      {book.price}원/일
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full" 
                  variant={book.available ? "warm" : "ghost"}
                  disabled={!book.available}
                >
                  {book.available ? "대여 요청" : "대여중"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              검색 결과가 없습니다. 다른 검색어를 시도해보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Books;