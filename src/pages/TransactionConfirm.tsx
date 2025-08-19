import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, User, Book, AlertTriangle } from "lucide-react";
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
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  borrower_id: string;
  owner_id: string;
  total_amount: number;
  created_at: string;
  book: {
    title: string;
    author: string;
    cover_image_url: string | null;
    daily_rate: number;
    weekly_rate: number;
  };
  borrower: {
    display_name: string | null;
  };
  owner: {
    display_name: string | null;
  };
}

const TransactionConfirm = () => {
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
            title,
            author,
            cover_image_url,
            daily_rate,
            weekly_rate
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

  const handleConfirm = async () => {
    if (!transaction || !user) return;

    setConfirming(true);

    try {
      const isOwner = transaction.owner_id === user.id;
      const updateField = isOwner ? 'owner_confirmed' : 'borrower_confirmed';
      
      const { error } = await supabase
        .from('transactions')
        .update({ [updateField]: true })
        .eq('id', transaction.id);

      if (error) {
        toast({
          title: "확인 처리 실패",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check if both parties have confirmed
      const bothConfirmed = isOwner 
        ? (transaction.borrower_confirmed && true)
        : (transaction.owner_confirmed && true);

      if (bothConfirmed) {
        // Both confirmed - start rental
        const { error: statusError } = await supabase
          .from('transactions')
          .update({ 
            status: 'in_progress',
            rental_start_date: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (statusError) {
          console.error('Error updating status:', statusError);
        }

        toast({
          title: "대여 시작!",
          description: "양쪽 모두 확인했습니다. 대여가 시작되었습니다.",
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              대여 시작 확인
            </h1>
            <p className="text-muted-foreground">
              양쪽 모두 버튼을 눌러 대여를 시작하세요
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                확인 진행도
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
                책 정보
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
                      대여료: {transaction.book?.daily_rate?.toLocaleString()}원/일
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
                거래 참여자
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
          <Card className="mb-6">
            <CardContent className="p-6">
              {bothConfirmed ? (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-700 mb-2">
                    대여가 시작되었습니다!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    책을 잘 이용하시고 기한 내에 반납해주세요.
                  </p>
                  <Button onClick={() => navigate("/my")} variant="warm" size="lg">
                    내 거래 내역 보기
                  </Button>
                </div>
              ) : myConfirmed ? (
                <div className="text-center">
                  <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">
                    상대방의 확인을 기다리는 중...
                  </h3>
                  <p className="text-muted-foreground">
                    {isOwner ? "대여자" : "책 주인"}가 확인 버튼을 누르면 대여가 시작됩니다.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    대여 시작 확인이 필요합니다
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    직접 만나서 책을 건네받은 후 아래 버튼을 눌러주세요.
                  </p>
                  <Button 
                    onClick={handleConfirm} 
                    variant="warm" 
                    size="lg" 
                    className="w-full"
                    disabled={confirming}
                  >
                    {confirming ? "확인 중..." : "대여 시작 확인"}
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

export default TransactionConfirm;