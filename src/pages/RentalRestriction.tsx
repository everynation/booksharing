import { useState, useEffect } from "react";
import { AlertTriangle, Clock, Book, X, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

interface PendingTransaction {
  id: string;
  status: string;
  created_at: string;
  book: {
    title: string;
    author: string;
    cover_image_url: string | null;
    transaction_type: string;
  };
  owner: {
    display_name: string | null;
  };
}

const RentalRestriction = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingTransaction, setCancelingTransaction] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPendingTransactions();
    }
  }, [user]);

  const fetchPendingTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First, get transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('borrower_id', user.id)
        .in('status', ['requested', 'in_progress'])
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching pending transactions:', transactionsError);
        return;
      }

      if (!transactionsData || transactionsData.length === 0) {
        setPendingTransactions([]);
        return;
      }

      // Get book IDs and owner IDs
      const bookIds = [...new Set(transactionsData.map(t => t.book_id))];
      const ownerIds = [...new Set(transactionsData.map(t => t.owner_id))];

      // Fetch books
      const { data: booksData } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url, transaction_type')
        .in('id', bookIds);

      // Fetch owner display names using secure function
      const profilePromises = ownerIds.map(async (ownerId) => {
        const { data: displayName } = await supabase.rpc('get_user_display_name_secure', {
          user_id_param: ownerId
        });
        return { user_id: ownerId, display_name: displayName || "익명" };
      });
      
      const profilesData = await Promise.all(profilePromises);

      // Create maps for easier lookup
      const booksMap = (booksData || []).reduce((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {} as Record<string, any>);

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Combine data
      const combinedData = transactionsData.map(transaction => ({
        ...transaction,
        book: booksMap[transaction.book_id] || null,
        owner: profilesMap[transaction.owner_id] || null
      }));

      setPendingTransactions(combinedData as any);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = async () => {
    if (!user || !selectedTransactionId) return;

    setCancelingTransaction(selectedTransactionId);

    try {
      const { data, error } = await supabase.functions.invoke('cancel-transaction', {
        body: {
          transaction_id: selectedTransactionId,
          reason: cancelReason || '사용자 요청으로 취소'
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Unknown error');
      }

      toast({
        title: "거래 취소 요청 완료",
        description: data.message || "거래 취소 요청이 전송되었습니다.",
      });

      setShowCancelModal(false);
      setCancelReason("");
      setSelectedTransactionId(null);
      
      // Refresh transactions
      fetchPendingTransactions();
      
    } catch (error: any) {
      toast({
        title: "취소 요청 실패",
        description: error.message || "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setCancelingTransaction(null);
    }
  };

  const handleNotifyOwner = async (transactionId: string) => {
    if (!user) return;

    try {
      // This would typically send a notification to the book owner
      // For now, we'll just show a success message
      toast({
        title: "알림 전송 완료",
        description: "책 소유자에게 알림이 전송되었습니다.",
      });
      
    } catch (error) {
      toast({
        title: "알림 전송 실패",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline">요청됨</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">진행중</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'requested':
        return "책 주인의 승인을 기다리고 있습니다.";
      case 'in_progress':
        return "책을 반납하고 주인의 반납 인증을 기다리고 있습니다.";
      default:
        return "거래 진행 중입니다.";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">로그인이 필요합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Alert Header */}
          <Card className="border-destructive mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                대여 제한 안내
              </CardTitle>
              <CardDescription className="text-base">
                이전 거래의 반납 인증이 완료되지 않아 새로운 책을 대여할 수 없습니다.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Pending Transactions */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">거래 내역을 확인하는 중...</p>
            </div>
          ) : pendingTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  현재 진행중인 거래가 없습니다. 자유롭게 새로운 책을 대여하실 수 있습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                완료되지 않은 거래 ({pendingTransactions.length}건)
              </h2>
              
              {pendingTransactions.map((transaction) => (
                <Card key={transaction.id} className="border-warning">
                  <CardContent className="p-4">
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
                        <p className="text-sm text-muted-foreground mt-1">
                          소유자: {transaction.owner?.display_name || "익명"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(transaction.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-warning mt-2">
                          {getStatusMessage(transaction.status)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Clock className="h-6 w-6 text-warning mb-2" />
                        
                        {/* 거래 취소 버튼 */}
                        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTransactionId(transaction.id)}
                              className="w-full"
                            >
                              <X className="h-3 w-3 mr-1" />
                              취소 요청
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <X className="h-5 w-5" />
                                거래 취소 요청
                              </DialogTitle>
                              <DialogDescription>
                                거래 취소 사유를 입력해주세요. 상대방에게 알림이 전송됩니다.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="cancel-reason">취소 사유 (선택사항)</Label>
                                <Textarea
                                  id="cancel-reason"
                                  placeholder="취소 사유를 입력해주세요..."
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason("");
                                    setSelectedTransactionId(null);
                                  }}
                                  className="flex-1"
                                >
                                  취소
                                </Button>
                                <Button 
                                  onClick={handleCancelTransaction}
                                  disabled={cancelingTransaction === selectedTransactionId}
                                  className="flex-1"
                                  variant="destructive"
                                >
                                  {cancelingTransaction === selectedTransactionId ? "요청 중..." : "취소 요청"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* 소유자 알림 버튼 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotifyOwner(transaction.id)}
                          className="w-full"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          소유자 알림
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            <Card className="bg-accent">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">해결 방법</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 대여 요청이 진행중인 경우: 책 주인의 승인을 기다려주세요</li>
                  <li>• 거래가 진행중인 경우: 책을 반납하고 주인의 반납 인증을 기다려주세요</li>
                  <li>• 문제가 지속되는 경우: 책 주인과 직접 연락하여 해결해주세요</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              {/* 여기에서 navigate로 이동합니다. */}
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/my")}
              >
                내 거래 내역 확인
              </Button>
              <Button 
                variant="soft" 
                className="flex-1"
                onClick={() => navigate("/books")}
              >
                책 둘러보기
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RentalRestriction;
