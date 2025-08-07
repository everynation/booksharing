import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, User, Phone, MessageCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { checkUserCanBorrow } from "@/lib/rentalUtils";
import Header from "@/components/Header";

interface BookDetail {
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
  profiles: {
    display_name: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

interface ExistingTransaction {
  id: string;
  status: string;
  borrower_id: string;
  owner_id: string;
}

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [existingTransaction, setExistingTransaction] = useState<ExistingTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/books");
      return;
    }
    fetchBookDetail();
  }, [id, navigate]);

  const fetchBookDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select(`
          *,
          profiles:user_id (
            display_name,
            phone,
            address
          )
        `)
        .eq('id', id)
        .single();

      if (bookError) {
        console.error('Error fetching book:', bookError);
        toast({
          title: "책 정보 로딩 실패",
          description: "책 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
        navigate("/books");
        return;
      }

      setBook(bookData as any);

      // Check for existing transaction if user is logged in
      if (user) {
        const { data: transactionData } = await supabase
          .from('transactions')
          .select('*')
          .eq('book_id', id)
          .or(`borrower_id.eq.${user.id},owner_id.eq.${user.id}`)
          .in('status', ['requested', 'in_progress'])
          .maybeSingle();

        if (transactionData) {
          setExistingTransaction(transactionData);
        }
      }
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

  const handleBorrowRequest = async () => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "대여 요청을 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

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

    setRequestLoading(true);

    try {
      // 1. 트랜잭션 생성
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          book_id: book.id,
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
        description: "직접 만나서 거래하세요. 책 주인과 연락하여 만날 장소와 시간을 정하세요.",
      });
      
      // Update book status to rented
      await supabase
        .from('books')
        .update({ status: 'rented' })
        .eq('id', book.id);
      
      // Refresh book detail
      fetchBookDetail();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleTransactionComplete = async () => {
    if (!existingTransaction) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'in_progress' }) // Change to in_progress instead of completed
        .eq('id', existingTransaction.id);

      if (error) {
        toast({
          title: "거래 완료 처리 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "거래 진행중",
          description: "책을 받았습니다. 책 주인이 반납 인증을 완료하면 거래가 완료됩니다.",
        });
        
        fetchBookDetail();
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop&crop=center";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="secondary">대여 가능</Badge>;
      case 'rented':
        return <Badge variant="outline">대여중</Badge>;
      case 'sold':
        return <Badge variant="destructive">판매완료</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getActionButton = () => {
    if (!user) {
      return (
        <Button onClick={() => navigate("/auth")} variant="warm" size="lg" className="w-full">
          로그인하여 {book?.transaction_type === "sale" ? "구매" : "대여"} 요청
        </Button>
      );
    }

    if (book?.user_id === user.id) {
      return (
        <Button variant="outline" size="lg" className="w-full" disabled>
          내가 등록한 책
        </Button>
      );
    }

    if (book?.status !== 'available') {
      return (
        <Button variant="ghost" size="lg" className="w-full" disabled>
          {book?.status === 'rented' ? '대여중' : '판매완료'}
        </Button>
      );
    }

    if (existingTransaction) {
      if (existingTransaction.status === 'requested') {
        return (
          <div className="space-y-3">
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm text-center">
                직접 만나서 거래하세요. 책 주인과 연락하여 만날 장소와 시간을 정하세요.
              </p>
            </div>
            {existingTransaction.borrower_id === user.id && (
              <Button onClick={handleTransactionComplete} variant="warm" size="lg" className="w-full">
                거래 완료 (책을 받았습니다)
              </Button>
            )}
          </div>
        );
      }
      if (existingTransaction.status === 'in_progress') {
        return (
          <Button variant="outline" size="lg" className="w-full" disabled>
            거래 진행중
          </Button>
        );
      }
    }

    return (
      <Button 
        onClick={handleBorrowRequest} 
        variant="warm" 
        size="lg" 
        className="w-full"
        disabled={requestLoading}
      >
        {requestLoading 
          ? "요청 중..." 
          : `${book?.transaction_type === "sale" ? "구매" : "대여"} 요청`
        }
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">책 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">책을 찾을 수 없습니다.</p>
            <Button onClick={() => navigate("/books")} className="mt-4">
              책 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/books")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              책 목록으로
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Book Image */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden relative">
                <img 
                  src={book.cover_image_url || getDefaultCoverImage()} 
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = getDefaultCoverImage();
                  }}
                />
                <div className="absolute top-4 right-4">
                  {getStatusBadge(book.status)}
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant={book.transaction_type === "sale" ? "destructive" : "secondary"}>
                    {book.transaction_type === "sale" ? "판매" : "대여"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Book Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-muted-foreground mb-4">{book.author}</p>
                {book.isbn && (
                  <p className="text-sm text-muted-foreground">ISBN: {book.isbn}</p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary">
                  {book.price.toLocaleString()}원{book.transaction_type === "rental" ? "/일" : ""}
                </span>
              </div>

              <Separator />

              {/* Owner Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    책 주인 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">이름:</span>
                    <span>{book.profiles?.display_name || "익명"}</span>
                  </div>
                  {book.profiles?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{book.profiles.address}</span>
                    </div>
                  )}
                  {book.profiles?.phone && existingTransaction && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{book.profiles.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">등록일: {new Date(book.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {getActionButton()}
                
                {/* Review Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    console.log("Navigating to review page:", `/books/${book.id}/review`);
                    navigate(`/books/${book.id}/review`);
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  독후감 보기
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookDetail;