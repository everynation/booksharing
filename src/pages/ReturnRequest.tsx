import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, Book, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface TransactionDetail {
  id: string;
  status: string;
  return_requested_at: string | null;
  return_deadline: string | null;
  rental_start_date: string | null;
  borrower_id: string;
  owner_id: string;
  total_amount: number;
  book: {
    title: string;
    author: string;
    cover_image_url: string | null;
    daily_rate: number;
  };
  borrower: {
    display_name: string | null;
  };
  owner: {
    display_name: string | null;
  };
}

const ReturnRequest = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    fetchTransaction();
  }, [id, navigate]);

  const fetchTransaction = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          book:book_id (
            title,
            author,
            cover_image_url,
            daily_rate
          ),
          borrower:borrower_id (
            display_name
          ),
          owner:owner_id (
            display_name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching transaction:', error);
        toast({
          title: "거래 정보 로딩 실패",
          description: "거래 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "거래를 찾을 수 없습니다",
          description: "요청한 거래 정보가 존재하지 않습니다.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check if user is part of this transaction
      if (data.borrower_id !== user.id && data.owner_id !== user.id) {
        toast({
          title: "접근 권한이 없습니다",
          description: "이 거래에 참여하지 않았습니다.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setTransaction(data as any);
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

  const handleReturnRequest = async () => {
    if (!transaction || !user) return;

    setRequesting(true);

    try {
      const returnDeadline = new Date();
      returnDeadline.setHours(returnDeadline.getHours() + 24);

      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'return_requested',
          return_requested_at: new Date().toISOString(),
          return_deadline: returnDeadline.toISOString()
        })
        .eq('id', transaction.id);

      if (error) {
        toast({
          title: "반납 요청 실패",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "반납 요청 완료",
        description: "책 주인에게 반납 요청이 전송되었습니다. 24시간 내에 만나서 반납해주세요.",
      });

      fetchTransaction();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop&crop=center";
  };

  const getRemainingTime = () => {
    if (!transaction?.return_deadline) return null;
    
    const deadline = new Date(transaction.return_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return "기한 만료";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}시간 ${minutes}분 남음`;
  };

  const getRentalDays = () => {
    if (!transaction?.rental_start_date) return 0;
    
    const startDate = new Date(transaction.rental_start_date);
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">거래 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">거래를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const isBorrower = transaction.borrower_id === user?.id;
  const remainingTime = getRemainingTime();
  const rentalDays = getRentalDays();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              내 거래로 돌아가기
            </Button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              책 반납 요청
            </h1>
            <p className="text-muted-foreground">
              {transaction.status === 'return_requested' 
                ? "반납 요청이 전송되었습니다" 
                : "책을 반납하려면 요청을 보내세요"
              }
            </p>
          </div>

          {/* Book Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                대여 중인 책
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={transaction.book?.cover_image_url || getDefaultCoverImage()} 
                    alt={transaction.book?.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultCoverImage();
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{transaction.book?.title}</h3>
                  <p className="text-sm text-muted-foreground">{transaction.book?.author}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      대여 기간: {rentalDays}일
                    </Badge>
                    <Badge variant="outline">
                      총 요금: {(rentalDays * (transaction.book?.daily_rate || 0)).toLocaleString()}원
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          {transaction.status === 'return_requested' ? (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Clock className="h-5 w-5" />
                  반납 요청 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">반납 요청 시간</span>
                    <span className="text-sm text-muted-foreground">
                      {transaction.return_requested_at 
                        ? new Date(transaction.return_requested_at).toLocaleString()
                        : "-"
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">반납 기한</span>
                    <span className={`text-sm font-medium ${
                      remainingTime === "기한 만료" ? "text-red-600" : "text-orange-600"
                    }`}>
                      {remainingTime || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <p className="text-sm text-orange-800">
                      책 주인과 연락하여 만날 시간과 장소를 정하세요. 
                      24시간 내에 만나서 함께 반납 완료 버튼을 눌러야 합니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  대여 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">대여 시작일</span>
                    <span className="text-sm text-muted-foreground">
                      {transaction.rental_start_date 
                        ? new Date(transaction.rental_start_date).toLocaleDateString()
                        : "-"
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">대여 기간</span>
                    <span className="text-sm text-muted-foreground">
                      {rentalDays}일
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">일일 대여료</span>
                    <span className="text-sm text-muted-foreground">
                      {transaction.book?.daily_rate?.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action */}
          <Card>
            <CardContent className="p-6">
              {transaction.status === 'return_requested' ? (
                <div className="text-center">
                  <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-orange-700 mb-2">
                    반납 요청이 전송되었습니다
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    책 주인과 연락하여 만날 시간과 장소를 정하세요.
                    24시간 내에 만나서 반납을 완료해야 합니다.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate(`/return-complete/${transaction.id}`)} 
                      variant="warm" 
                      size="lg"
                      className="flex-1"
                    >
                      반납 완료 하기
                    </Button>
                  </div>
                </div>
              ) : isBorrower ? (
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    책을 반납하시겠습니까?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    반납 요청을 보내면 책 주인에게 알림이 전송되고,
                    24시간 내에 만나서 반납을 완료해야 합니다.
                  </p>
                  <Button 
                    onClick={handleReturnRequest} 
                    variant="warm" 
                    size="lg" 
                    className="w-full"
                    disabled={requesting}
                  >
                    {requesting ? "요청 중..." : "반납 요청 보내기"}
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Book className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    대여자의 반납 요청을 기다리는 중
                  </h3>
                  <p className="text-muted-foreground">
                    대여자가 반납 요청을 보내면 알림을 받을 수 있습니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReturnRequest;