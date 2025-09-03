import { useState, useEffect } from "react";
import { Gift, CheckCircle, Star, Book, Mail, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface EligibleBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  price: number;
  total_earnings: number;
  completed_transactions: number;
}

const RewardNotification = () => {
  const { user } = useAuth();
  const [eligibleBooks, setEligibleBooks] = useState<EligibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [rewardClaims, setRewardClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEligibleBooks();
      fetchRewardClaims();
      fetchUserAddress();
    }
  }, [user]);

  const fetchEligibleBooks = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get books owned by user with completed rental transactions
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          cover_image_url,
          price,
          transaction_type
        `)
        .eq('user_id', user.id)
        .eq('transaction_type', 'rental'); // Only rental books are eligible for rewards

      if (booksError) {
        console.error('Error fetching books:', booksError);
        return;
      }

      const books = booksData || [];
      const eligibleBooksData: EligibleBook[] = [];

      // For each book, calculate total earnings from completed transactions
      for (const book of books) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('book_id', book.id)
          .eq('status', 'completed');

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError);
          continue;
        }

        const transactions = transactionsData || [];
        const totalEarnings = transactions.length * book.price; // Each completed transaction earns the daily rate
        const completedTransactions = transactions.length;

        // Check if total earnings exceed book price (eligible for reward)
        if (totalEarnings > book.price && completedTransactions > 0) {
          eligibleBooksData.push({
            id: book.id,
            title: book.title,
            author: book.author,
            cover_image_url: book.cover_image_url,
            price: book.price,
            total_earnings: totalEarnings,
            completed_transactions: completedTransactions,
          });
        }
      }

      setEligibleBooks(eligibleBooksData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAddress = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('address')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.address) {
        setDeliveryAddress(profile.address);
      }
    } catch (error) {
      console.error('Error fetching user address:', error);
    }
  };

  const fetchRewardClaims = async () => {
    if (!user) return;
    
    try {
      setLoadingClaims(true);
      const { data: claims } = await supabase
        .from('reward_claims')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setRewardClaims(claims || []);
    } catch (error) {
      console.error('Error fetching reward claims:', error);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleClaimReward = async () => {
    if (!user || eligibleBooks.length === 0) return;

    if (!deliveryAddress.trim()) {
      toast({
        title: "배송 주소 필요",
        description: "배송받을 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setClaimingReward(true);

    try {
      const { data, error } = await supabase.functions.invoke('claim-reward', {
        body: {
          eligible_books: eligibleBooks,
          delivery_address: deliveryAddress
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Unknown error');
      }

      toast({
        title: "보상 신청 완료",
        description: data.message || "관리자가 확인 후 새 책을 보내드립니다.",
      });

      setShowClaimModal(false);
      fetchRewardClaims(); // Refresh claims list
      
    } catch (error: any) {
      toast({
        title: "보상 신청 실패",
        description: error.message || "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setClaimingReward(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">검토 중</Badge>;
      case 'approved':
        return <Badge variant="secondary">승인됨</Badge>;
      case 'shipped':
        return <Badge variant="default">배송 중</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500">배송 완료</Badge>;
      case 'rejected':
        return <Badge variant="destructive">거절됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center";
  };

  const calculateProfitRatio = (earnings: number, price: number) => {
    return Math.round((earnings / price) * 100);
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
          {/* Congratulations Header */}
          <Card className="border-primary mb-6">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Gift className="h-16 w-16 text-primary" />
              </div>
              <CardTitle className="text-2xl text-primary">
                🎉 축하합니다!
              </CardTitle>
              <CardDescription className="text-base">
                책 대여로 원래 가격보다 더 많은 수익을 얻으셨습니다!
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">보상 대상 확인 중...</p>
            </div>
          ) : eligibleBooks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  아직 보상 대상 책이 없습니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  책을 대여해서 원래 가격보다 더 많은 수익을 얻으면 새 책을 보상으로 받을 수 있습니다!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Reward Message */}
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    새 책을 보상으로 보내드립니다!
                  </CardTitle>
                  <CardDescription>
                    아래 책들의 대여 수익이 원래 가격을 초과했습니다. 
                    새로운 책을 보상으로 받을 자격이 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Eligible Books List */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">보상 대상 책 ({eligibleBooks.length}권)</h2>
                
                {eligibleBooks.map((book) => (
                  <Card key={book.id} className="border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0 relative">
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
                            <div className="absolute bottom-0 right-0">
                              <div className="relative">
                                <img
                                  src={book.cover_image_url}
                                  alt="DB 표지"
                                  className="w-6 h-8 object-cover rounded border border-white shadow-sm"
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
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>원래 가격:</span>
                              <span>{book.price.toLocaleString()}원</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>총 수익:</span>
                              <span className="font-semibold text-primary">
                                {book.total_earnings.toLocaleString()}원
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>완료된 대여:</span>
                              <span>{book.completed_transactions}회</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant="default" className="bg-primary">
                            {calculateProfitRatio(book.total_earnings, book.price)}% 수익
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Reward Claim Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    보상 신청
                  </CardTitle>
                  <CardDescription>
                    새 책 수령을 원하시면 아래 버튼을 클릭해주세요. 
                    관리자가 확인 후 연락드립니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-accent rounded-lg">
                    <h4 className="font-medium mb-2">보상 안내</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 보상용 새 책은 관리자가 선별하여 보내드립니다</li>
                      <li>• 등록된 주소로 배송됩니다 (배송비 무료)</li>
                      <li>• 신청 후 3-5일 내에 배송 예정입니다</li>
                      <li>• 문의사항은 고객센터로 연락해주세요</li>
                    </ul>
                  </div>

                  <Dialog open={showClaimModal} onOpenChange={setShowClaimModal}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        variant="warm"
                        size="lg"
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        새 책 보상 신청하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Gift className="h-5 w-5" />
                          보상 신청 확인
                        </DialogTitle>
                        <DialogDescription>
                          새 책 보상 신청 정보를 확인하고 주소를 입력해주세요.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {/* 보상 정보 요약 */}
                        <Card>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">보상 대상 책</h4>
                            <div className="space-y-1 text-sm">
                              {eligibleBooks.map(book => (
                                <div key={book.id} className="flex justify-between">
                                  <span>{book.title}</span>
                                  <span className="text-primary font-medium">
                                    {book.total_earnings.toLocaleString()}원
                                  </span>
                                </div>
                              ))}
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-medium">
                              <span>총 수익:</span>
                              <span className="text-primary">
                                {eligibleBooks.reduce((sum, book) => sum + book.total_earnings, 0).toLocaleString()}원
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* 배송 정보 */}
                        <div className="space-y-2">
                          <Label htmlFor="delivery-address">배송 주소 *</Label>
                          <Textarea
                            id="delivery-address"
                            placeholder="배송받을 주소를 입력해주세요"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            rows={3}
                          />
                        </div>

                        {/* 예상 배송 일정 */}
                        <div className="p-3 bg-accent rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">예상 배송 일정</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            신청 완료 후 3-5일 내 배송 예정 (배송비 무료)
                          </p>
                        </div>

                        {/* 신청 버튼 */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowClaimModal(false)}
                            className="flex-1"
                          >
                            취소
                          </Button>
                          <Button 
                            onClick={handleClaimReward}
                            disabled={claimingReward || !deliveryAddress.trim()}
                            className="flex-1"
                          >
                            {claimingReward ? "신청 중..." : "보상 신청"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="text-center">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      관리자에게 문의하기
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 보상 신청 내역 */}
              {rewardClaims.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      보상 신청 내역
                    </CardTitle>
                    <CardDescription>
                      지금까지의 보상 신청 현황을 확인할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingClaims ? (
                      <p className="text-muted-foreground text-center py-4">로딩 중...</p>
                    ) : (
                      rewardClaims.map((claim) => (
                        <Card key={claim.id} className="border-accent">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">
                                  신청일: {new Date(claim.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  보상 가치: {claim.total_reward_value.toLocaleString()}원
                                </p>
                              </div>
                              {getStatusBadge(claim.status)}
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span>배송지: {claim.delivery_address || '주소 없음'}</span>
                              </div>
                              <p>
                                대상 책: {Array.isArray(claim.eligible_books) ? claim.eligible_books.length : 0}권
                              </p>
                              {claim.admin_notes && (
                                <p className="text-orange-600">
                                  관리자 메모: {claim.admin_notes}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RewardNotification;