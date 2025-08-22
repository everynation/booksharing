import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, DollarSign } from "lucide-react";

interface RentalContract {
  id: string;
  book_id: string;
  owner_id: string;
  borrower_id: string;
  status: string;
  daily_price: number;
  late_daily_price?: number;
  new_book_price_cap: number;
  start_date?: string;
  end_date?: string;
  next_charge_at?: string;
  total_charged: number;
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  borrower_return_ok: boolean;
  owner_return_ok: boolean;
  created_at: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url?: string;
}

export default function ContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadContract();
    getCurrentUser();
  }, [contractId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadContract = async () => {
    if (!contractId) return;

    try {
      const { data: contractData, error: contractError } = await supabase
        .from('rental_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (contractError) throw contractError;

      setContract(contractData);

      // Load book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('id, title, author, cover_image_url')
        .eq('id', contractData.book_id)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

    } catch (error) {
      console.error('Error loading contract:', error);
      toast({
        title: "Error",
        description: "Failed to load contract details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgree = async () => {
    if (!contract) return;

    try {
      const { data, error } = await supabase.functions.invoke('contract-agree', {
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agreement confirmed",
      });

      loadContract(); // Reload to get updated status
    } catch (error) {
      console.error('Error confirming agreement:', error);
      toast({
        title: "Error",
        description: "Failed to confirm agreement",
        variant: "destructive",
      });
    }
  };

  const handleReturnRequest = async () => {
    if (!contract) return;

    try {
      const { data, error } = await supabase.functions.invoke('contract-return-request', {
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Return request initiated",
      });

      loadContract();
    } catch (error) {
      console.error('Error requesting return:', error);
      toast({
        title: "Error",
        description: "Failed to request return",
        variant: "destructive",
      });
    }
  };

  const handleReturnAgree = async () => {
    if (!contract) return;

    try {
      const { data, error } = await supabase.functions.invoke('contract-return-agree', {
        method: 'POST',
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Return agreement confirmed",
      });

      loadContract();
    } catch (error) {
      console.error('Error confirming return:', error);
      toast({
        title: "Error",
        description: "Failed to confirm return",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'ACTIVE': return 'default';
      case 'RETURN_PENDING': return 'outline';
      case 'RETURNED': return 'default';
      case 'FORCE_CLOSED': return 'destructive';
      case 'EXPIRED': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '대여 동의 대기';
      case 'ACTIVE': return '대여 중';
      case 'RETURN_PENDING': return '반납 동의 대기';
      case 'RETURNED': return '반납 완료';
      case 'FORCE_CLOSED': return '강제 종료';
      case 'EXPIRED': return '만료됨';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()}원`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!contract || !book || !currentUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">계약을 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId === contract.owner_id;
  const isBorrower = currentUserId === contract.borrower_id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <h1 className="text-3xl font-bold">대여 계약 상세</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Info */}
        <Card>
          <CardHeader>
            <CardTitle>책 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {book.cover_image_url && (
                <img 
                  src={book.cover_image_url} 
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-semibold">{book.title}</h3>
                <p className="text-muted-foreground text-sm">{book.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Status */}
        <Card>
          <CardHeader>
            <CardTitle>계약 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant={getStatusBadgeVariant(contract.status)} className="text-sm">
              {getStatusLabel(contract.status)}
            </Badge>
            
            {contract.status === 'PENDING' && (
              <div className="space-y-2">
                <p className="text-sm">동의 현황:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>소유자:</span>
                    <span className={contract.owner_confirmed ? "text-green-600" : "text-muted-foreground"}>
                      {contract.owner_confirmed ? "동의함" : "대기 중"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>대여자:</span>
                    <span className={contract.borrower_confirmed ? "text-green-600" : "text-muted-foreground"}>
                      {contract.borrower_confirmed ? "동의함" : "대기 중"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {contract.status === 'RETURN_PENDING' && (
              <div className="space-y-2">
                <p className="text-sm">반납 동의 현황:</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>소유자:</span>
                    <span className={contract.owner_return_ok ? "text-green-600" : "text-muted-foreground"}>
                      {contract.owner_return_ok ? "동의함" : "대기 중"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>대여자:</span>
                    <span className={contract.borrower_return_ok ? "text-green-600" : "text-muted-foreground"}>
                      {contract.borrower_return_ok ? "동의함" : "대기 중"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              요금 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>일일 요금:</span>
              <span className="font-medium">{formatCurrency(contract.daily_price)}</span>
            </div>
            {contract.late_daily_price && (
              <div className="flex justify-between text-sm">
                <span>연체 일일 요금:</span>
                <span className="font-medium">{formatCurrency(contract.late_daily_price)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>신책가 상한:</span>
              <span className="font-medium">{formatCurrency(contract.new_book_price_cap)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span>누적 결제:</span>
              <span className="font-bold text-primary">{formatCurrency(contract.total_charged)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Time Info */}
        {(contract.start_date || contract.next_charge_at) && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                시간 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contract.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">시작일</p>
                    <p className="font-medium">{formatDate(contract.start_date)}</p>
                  </div>
                )}
                {contract.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">종료일</p>
                    <p className="font-medium">{formatDate(contract.end_date)}</p>
                  </div>
                )}
                {contract.next_charge_at && contract.status === 'ACTIVE' && (
                  <div>
                    <p className="text-sm text-muted-foreground">다음 청구일</p>
                    <p className="font-medium">{formatDate(contract.next_charge_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {contract.status === 'PENDING' && (
                <>
                  {isOwner && !contract.owner_confirmed && (
                    <Button onClick={handleAgree}>대여 동의</Button>
                  )}
                  {isBorrower && !contract.borrower_confirmed && (
                    <Button onClick={handleAgree}>대여 동의</Button>
                  )}
                </>
              )}

              {contract.status === 'ACTIVE' && (
                <Button onClick={handleReturnRequest} variant="outline">
                  반납 요청
                </Button>
              )}

              {contract.status === 'RETURN_PENDING' && (
                <>
                  {isOwner && !contract.owner_return_ok && (
                    <Button onClick={handleReturnAgree}>반납 동의</Button>
                  )}
                  {isBorrower && !contract.borrower_return_ok && (
                    <Button onClick={handleReturnAgree}>반납 동의</Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}