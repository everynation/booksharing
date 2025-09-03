import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, Filter, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { checkUserCanBorrow } from "@/lib/rentalUtils";
import Header from "@/components/Header";

interface BookProfile {
  display_name: string | null;
  address: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_image_url: string | null;
  transaction_type: string;
  price: number;
  status: string;
  created_at: string;
  user_id: string;
  profiles: BookProfile | null;
}

const Books = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "sale" | "rental">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "price" | "title">("created_at");

  useEffect(() => {
    fetchBooks();
  }, [transactionTypeFilter, sortBy]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // Fetch books with minimal secure data - RLS policies now protect sensitive info
      let query = supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          isbn,
          cover_image_url,
          transaction_type,
          price,
          status,
          created_at,
          user_id
        `)
        .eq('status', 'available');

      // Apply transaction type filter
      if (transactionTypeFilter !== "all") {
        query = query.eq('transaction_type', transactionTypeFilter);
      }

      // Apply sorting
      const ascending = sortBy === "title";
      query = query.order(sortBy, { ascending });

      const { data: booksData, error } = await query;

      if (error) {
        console.error('Error fetching books:', error);
        toast({
          title: "책 목록 로딩 실패",
          description: "책 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      if (!booksData || booksData.length === 0) {
        setBooks([]);
        return;
      }

      // For public browsing, only get basic profile info for books they can access
      // RLS policies ensure only authorized access to owner contact details
      const booksWithBasicInfo = booksData.map(book => ({
        ...book,
        profiles: {
          display_name: "익명", // Hide owner identity for security
          address: null // Hide exact addresses for security
        }
      }));

      setBooks(booksWithBasicInfo as any);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowRequest = async (bookId: string) => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "대여 요청을 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Check if user is trying to borrow their own book
    if (book.user_id === user.id) {
      toast({
        title: "본인 책은 대여할 수 없습니다",
        description: "자신이 등록한 책은 대여할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    // Check if user can borrow (no pending transactions)
    const { canBorrow } = await checkUserCanBorrow(user.id);
    if (!canBorrow) {
      navigate("/rental-restriction");
      return;
    }

    try {
      // 1. 트랜잭션 생성
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          book_id: bookId,
          borrower_id: user.id,
          owner_id: book.user_id,
          status: 'requested',
        })
        .select('id')
        .single();

      if (transactionError) {
        toast({
          title: "대여 요청 실패",
          description: transactionError.message,
          variant: "destructive",
        });
        return;
      }

      // 2. 초기 메시지 생성
      const initialMessage = `📚 "${book.title}" 책을 대여하고 싶습니다.`;
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          transaction_id: transactionData.id,
          sender_id: user.id,
          receiver_id: book.user_id,
          message: initialMessage
        });

      if (messageError) {
        console.error('Error creating initial message:', messageError);
        // 메시지 생성 실패해도 트랜잭션은 유지
      }

      toast({
        title: "대여 요청 완료",
        description: "직접 만나서 거래하세요. 책 주인에게 연락하여 만날 장소와 시간을 정하세요.",
      });
      
      // Update book status to rented
      await supabase
        .from('books')
        .update({ status: 'rented' })
        .eq('id', bookId);
      
      // Refresh books list
      fetchBooks();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center";
  };

  return (
    <div className="min-h-screen bg-background">
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
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="책 제목이나 저자를 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* 필터 및 정렬 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={transactionTypeFilter} onValueChange={(value: "all" | "sale" | "rental") => setTransactionTypeFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 유형</SelectItem>
              <SelectItem value="rental">대여</SelectItem>
              <SelectItem value="sale">판매</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "created_at" | "price" | "title") => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <Clock className="h-4 w-4" />
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">최신순</SelectItem>
              <SelectItem value="price">가격순</SelectItem>
              <SelectItem value="title">제목순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">책 목록을 불러오는 중...</p>
          </div>
        )}

        {/* 책 목록 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/books/${book.id}`)}>
                <CardHeader className="p-0">
                                  <div className="aspect-[3/4] bg-muted relative">
                  {/* 실제 사진 (사용자가 업로드한 이미지) */}
                  <img 
                    src={getDefaultCoverImage()} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultCoverImage();
                    }}
                  />
                  
                  {/* 데이터베이스에서 불러온 표지 (오른쪽 아래 작게 표시) */}
                  {book.cover_image_url && (
                    <div className="absolute bottom-2 right-2">
                      <div className="relative">
                        <img 
                          src={book.cover_image_url} 
                          alt="DB 표지"
                          className="w-12 h-16 object-cover rounded border border-white shadow-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                          DB
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute top-2 right-2">
                    <Badge variant={book.transaction_type === "sale" ? "destructive" : "secondary"}>
                      {book.transaction_type === "sale" ? "판매" : "대여"}
                    </Badge>
                  </div>
                  {book.status !== 'available' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="outline" className="bg-background">
                        {book.status === 'rented' ? '대여중' : '판매완료'}
                      </Badge>
                    </div>
                  )}
                </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 line-clamp-1">
                    {book.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                  {book.isbn && (
                    <p className="text-xs text-muted-foreground mb-3">ISBN: {book.isbn}</p>
                  )}
                  
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        소유자: {book.profiles?.display_name || "익명"}
                      </span>
                      <span className="font-semibold text-primary">
                        {book.price.toLocaleString()}원{book.transaction_type === "rental" ? "/일" : ""}
                      </span>
                    </div>
                    {book.profiles?.address && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{book.profiles.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  {book.user_id === user?.id ? (
                    // 내가 등록한 책인 경우 - 보기/수정 버튼
                    <div className="flex gap-2 w-full">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/books/${book.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        보기
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-book/${book.id}`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        수정
                      </Button>
                    </div>
                  ) : (
                    // 다른 사용자의 책인 경우 - 대여/구매 요청 버튼
                    <Button 
                      className="w-full" 
                      variant={book.status === 'available' ? "warm" : "ghost"}
                      disabled={book.status !== 'available'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBorrowRequest(book.id);
                      }}
                    >
                      {book.status === 'available' 
                        ? `${book.transaction_type === "sale" ? "구매" : "대여"} 요청`
                        : (book.status === 'rented' ? '대여중' : '판매완료')
                      }
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery 
                ? "검색 결과가 없습니다. 다른 검색어를 시도해보세요."
                : "등록된 책이 없습니다. 첫 번째 책을 등록해보세요!"
              }
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Books;