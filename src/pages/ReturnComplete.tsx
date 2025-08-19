import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Clock, Book, User, AlertTriangle } from "lucide-react";
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
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  borrower_id: string;
  owner_id: string;
  total_amount: number;
  book: {
    id: string;
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

const ReturnComplete = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

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
            id,
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

  const handleConfirmReturn = async () => {
    if (!transaction || !user) return;

    setConfirming(true);

    try {
      // Reset confirmation flags for return process
      const isOwner = transaction.owner_id === user.id;
      const updateField = isOwner ? 'owner_confirmed' : 'borrower_confirmed';
      
      // If this is the first confirmation for return, reset both flags
      const resetConfirmations = !transaction.borrower_confirmed && !transaction.owner_confirmed;
      
      const updateData: any = {};
      if (resetConfirmations) {
        updateData.borrower_confirmed = false;
        updateData.owner_confirmed = false;
      }
      updateData[updateField] = true;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transaction.id);

      if (error) {
        toast({
          title: "확인 처리 실패",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check if both parties have confirmed return
      const bothConfirmed = isOwner 
        ? (transaction.borrower_confirmed && true)
        : (transaction.owner_confirmed && true);

      if (bothConfirmed || (resetConfirmations && true)) {
        // Calculate rental days and total amount
        const rentalDays = Math.ceil(
          (new Date().getTime() - new Date(transaction.rental_start_date!).getTime()) / (1000 * 60 * 60 * 24)
        );
        const totalAmount = rentalDays * (transaction.book?.daily_rate || 0);

        // Complete the transaction
        const { error: completeError } = await supabase
          .from('transactions')
          .update({ 
            status: 'completed',
            rental_end_date: new Date().toISOString(),
            total_amount: totalAmount
          })
          .eq('id', transaction.id);

        if (completeError) {
          console.error('Error completing transaction:', completeError);
        }

        // Update book status back to available
        const { error: bookError } = await supabase
          .from('books')
          .update({ status: 'available' })
          .eq('id', transaction.book?.id);

        if (bookError) {
          console.error('Error updating book status:', bookError);
        }

        toast({
          title: "반납 완료!",
          description: "거래가 성공적으로 완료되었습니다. 정산이 처리됩니다.",
        });
      } else {
        toast({
          title: "확인 완료",
          description: "상대방의 확인을 기다리고 있습니다.",
        });
      }

      fetchTransaction();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
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

  const isOwner = transaction.owner_id === user?.id;
  const myConfirmed = isOwner ? transaction.owner_confirmed : transaction.borrower_confirmed;
  const otherConfirmed = isOwner ? transaction.borrower_confirmed : transaction.owner_confirmed;
  const bothConfirmed = myConfirmed && otherConfirmed;
  const progress = myConfirmed && otherConfirmed ? 100 : myConfirmed || otherConfirmed ? 50 : 0;
  const remainingTime = getRemainingTime();

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
              반납 완료 확인
            </h1>
            <p className="text-muted-foreground">
              양쪽 모두 버튼을 눌러 반납을 완료하세요
            </p>
          </div>

          {/* Deadline Warning */}
          {remainingTime && remainingTime !== "기한 만료" && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-700">반납 기한</p>
                    <p className="text-sm text-orange-600">{remainingTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                반납 확인 진행도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {myConfirmed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>내 확인</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {otherConfirmed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>상대방 확인</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Book Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                반납할 책
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
                      일일 대여료: {transaction.book?.daily_rate?.toLocaleString()}원
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                확인 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">책 주인</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.owner?.display_name || "익명"}
                    </p>
                  </div>
                  {transaction.owner_confirmed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                  <div>
                    <p className="font-medium">대여자</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.borrower?.display_name || "익명"}
                    </p>
                  </div>
                  {transaction.borrower_confirmed ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Card>
            <CardContent className="p-6">
              {transaction.status === 'completed' ? (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    반납이 완료되었습니다!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    거래가 성공적으로 완료되었고 정산이 처리되었습니다.
                  </p>
                  <Button onClick={() => navigate("/my")} variant="warm" size="lg">
                    내 거래 내역 보기
                  </Button>
                </div>
              ) : bothConfirmed ? (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    반납이 완료되었습니다!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    정산 처리 중입니다...
                  </p>
                </div>
              ) : myConfirmed ? (
                <div className="text-center">
                  <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">
                    상대방의 확인을 기다리는 중...
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwner ? "대여자" : "책 주인"}가 확인 버튼을 누르면 반납이 완료됩니다.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    반납 완료 확인이 필요합니다
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    직접 만나서 책을 반납받은 후 아래 버튼을 눌러주세요.
                  </p>
                  <Button 
                    onClick={handleConfirmReturn} 
                    variant="warm" 
                    size="lg" 
                    className="w-full"
                    disabled={confirming}
                  >
                    {confirming ? "확인 중..." : "반납 완료 확인"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ReturnComplete;