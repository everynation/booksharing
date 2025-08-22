import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, XCircle, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface RentalHandshake {
  id: string;
  transaction_id: string;
  owner_confirmed: boolean;
  borrower_confirmed: boolean;
  expires_at: string;
}

interface TransactionDetail {
  id: string;
  type: string;
  status: string;
  owner_id: string;
  borrower_id: string;
  book: {
    title: string;
    author: string;
    cover_image_url: string | null;
  };
  owner_profile: {
    display_name: string | null;
  };
  borrower_profile: {
    display_name: string | null;
  };
}

const RentalConfirm = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [handshake, setHandshake] = useState<RentalHandshake | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!transactionId) {
      navigate("/");
      return;
    }
    fetchData();
  }, [transactionId, navigate]);

  useEffect(() => {
    if (!handshake) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiresAt = new Date(handshake.expires_at).getTime();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        fetchData(); // Refresh to get updated status
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handshake]);

  const fetchData = async () => {
    if (!transactionId || !user) return;

    try {
      setLoading(true);

      // Fetch transaction details
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          status,
          owner_id,
          borrower_id,
          books!inner(title, author, cover_image_url)
        `)
        .eq('id', transactionId)
        .single();

      if (transactionError) {
        toast({
          title: "거래 정보를 불러올 수 없습니다",
          description: transactionError.message,
          variant: "destructive",
        });
        return;
      }

      if (!transactionData) {
        toast({
          title: "거래를 찾을 수 없습니다",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Check if user is part of this transaction
      if (transactionData.owner_id !== user.id && transactionData.borrower_id !== user.id) {
        toast({
          title: "접근 권한이 없습니다",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', [transactionData.owner_id, transactionData.borrower_id]);

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      setTransaction({
        ...transactionData,
        book: transactionData.books,
        owner_profile: profilesMap[transactionData.owner_id] || { display_name: null },
        borrower_profile: profilesMap[transactionData.borrower_id] || { display_name: null },
      } as any);

      // Fetch handshake details if this is a rental
      if (transactionData.type === 'rental') {
        const { data: handshakeData } = await supabase
          .from('rental_handshakes')
          .select('*')
          .eq('transaction_id', transactionId)
          .single();

        if (handshakeData) {
          setHandshake(handshakeData);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
    if (!handshake || !user || !transaction) return;

    setConfirming(true);
    
    try {
      const isOwner = transaction.owner_id === user.id;
      const updateField = isOwner ? 'owner_confirmed' : 'borrower_confirmed';

      // Update handshake confirmation
      const { error: handshakeError } = await supabase
        .from('rental_handshakes')
        .update({ [updateField]: true })
        .eq('id', handshake.id);

      if (handshakeError) {
        toast({
          title: "확정 처리 실패",
          description: handshakeError.message,
          variant: "destructive",
        });
        return;
      }

      // Check if both parties have confirmed
      const newOwnerConfirmed = isOwner ? true : handshake.owner_confirmed;
      const newBorrowerConfirmed = !isOwner ? true : handshake.borrower_confirmed;

      if (newOwnerConfirmed && newBorrowerConfirmed) {
        // Both confirmed - update transaction status
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({ status: 'RENTAL_ACTIVE' })
          .eq('id', transaction.id);

        if (transactionError) {
          console.error('Error updating transaction:', transactionError);
        }

        toast({
          title: "대여 확정 완료!",
          description: "양측이 모두 확정했습니다. 대여가 시작되었습니다.",
        });
      } else {
        toast({
          title: "확정 완료",
          description: "상대방의 확정을 기다리고 있습니다.",
        });
      }

      fetchData(); // Refresh data
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

  const formatTimeLeft = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (!handshake) return null;

    const now = new Date().getTime();
    const expiresAt = new Date(handshake.expires_at).getTime();
    const isExpired = now > expiresAt;

    if (isExpired) {
      return <Badge variant="destructive">만료됨</Badge>;
    }

    if (handshake.owner_confirmed && handshake.borrower_confirmed) {
      return <Badge variant="default">확정 완료</Badge>;
    }

    return <Badge variant="secondary">대기중</Badge>;
  };

  const getProgressValue = () => {
    if (!handshake) return 0;
    
    const confirmedCount = (handshake.owner_confirmed ? 1 : 0) + (handshake.borrower_confirmed ? 1 : 0);
    return (confirmedCount / 2) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩중...</p>
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
            <Button onClick={() => navigate("/")} className="mt-4">
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === transaction.owner_id;
  const userConfirmed = handshake && (isOwner ? handshake.owner_confirmed : handshake.borrower_confirmed);
  const otherConfirmed = handshake && (isOwner ? handshake.borrower_confirmed : handshake.owner_confirmed);
  const bothConfirmed = handshake && handshake.owner_confirmed && handshake.borrower_confirmed;
  const isExpired = handshake && new Date().getTime() > new Date(handshake.expires_at).getTime();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/books")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  대여 확정
                </CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Book Info */}
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-muted rounded flex-shrink-0">
                  {transaction.book.cover_image_url ? (
                    <img 
                      src={transaction.book.cover_image_url} 
                      alt={transaction.book.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      책표지
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{transaction.book.title}</h3>
                  <p className="text-sm text-muted-foreground">{transaction.book.author}</p>
                </div>
              </div>

              {/* Time Remaining */}
              {handshake && !bothConfirmed && !isExpired && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">남은 시간</span>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTimeLeft(timeLeft)}
                    </span>
                  </div>
                  <Progress value={(timeLeft / (30 * 60 * 1000)) * 100} className="h-2" />
                </div>
              )}

              {/* Confirmation Progress */}
              {handshake && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">확정 진행상황</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(getProgressValue())}%
                    </span>
                  </div>
                  <Progress value={getProgressValue()} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      {handshake.owner_confirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        소유자: {transaction.owner_profile.display_name || "익명"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {handshake.borrower_confirmed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        대여자: {transaction.borrower_profile.display_name || "익명"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-4">
                {bothConfirmed ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 font-medium">
                      ✅ 대여가 확정되었습니다!
                    </div>
                    <Button 
                      onClick={() => navigate("/my-page")} 
                      variant="warm" 
                      className="w-full"
                    >
                      거래 내역 보기
                    </Button>
                  </div>
                ) : isExpired ? (
                  <div className="text-center space-y-4">
                    <div className="text-red-600 font-medium">
                      ❌ 확정 시간이 만료되었습니다
                    </div>
                    <Button 
                      onClick={() => navigate("/books")} 
                      variant="outline" 
                      className="w-full"
                    >
                      책 목록으로 돌아가기
                    </Button>
                  </div>
                ) : userConfirmed ? (
                  <div className="text-center space-y-4">
                    <div className="text-blue-600 font-medium">
                      ✅ 확정 완료! 상대방의 확정을 기다리고 있습니다.
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      대기 중
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConfirm}
                    disabled={confirming}
                    variant="warm"
                    className="w-full"
                  >
                    {confirming ? "확정 처리중..." : "대여 확정"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default RentalConfirm;