import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Wallet, 
  Settings, 
  Book, 
  CreditCard, 
  LogOut, 
  Key,
  Bell,
  Globe,
  MapPin,
  Plus,
  Eye,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Profile {
  display_name: string | null;
  address: string | null;
  phone: string | null;
}

interface Wallet {
  balance: number;
}

interface WalletTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface BorrowedBook {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    cover_image_url: string | null;
  } | null;
  status: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  total_amount: number | null;
}

interface LentBook {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    cover_image_url: string | null;
  } | null;
  status: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  total_amount: number | null;
  borrower: {
    display_name: string | null;
  } | null;
}

const MyPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [lentBooks, setLentBooks] = useState<LentBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchUserData();
  }, [user, authLoading, navigate]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, address, phone')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletData) {
        setWallet(walletData);
      }

      // Fetch wallet transactions
      const { data: transactionData } = await supabase
        .from('wallet_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionData) {
        setWalletTransactions(transactionData);
      }

      // Fetch borrowed books
      const { data: borrowedData } = await supabase
        .from('transactions')
        .select(`
          id,
          status,
          rental_start_date,
          rental_end_date,
          total_amount,
          book:book_id (
            id,
            title,
            author,
            cover_image_url
          )
        `)
        .eq('borrower_id', user.id)
        .order('created_at', { ascending: false });

      if (borrowedData) {
        setBorrowedBooks(borrowedData as any);
      }

      // Fetch lent books
      const { data: lentData } = await supabase
        .from('transactions')
        .select(`
          id,
          status,
          rental_start_date,
          rental_end_date,
          total_amount,
          book:book_id (
            id,
            title,
            author,
            cover_image_url
          ),
          borrower:borrower_id (
            display_name
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (lentData) {
        setLentBooks(lentData as any);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "데이터 로딩 실패",
        description: "사용자 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="outline">요청됨</Badge>;
      case 'approved':
        return <Badge variant="secondary">승인됨</Badge>;
      case 'active':
        return <Badge variant="default">진행중</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">완료</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center";
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + "원";
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'charge':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'payment':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'earning':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">
                  {profile?.display_name || "사용자"}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
                {profile?.address && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{profile.address}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">내 활동</TabsTrigger>
            <TabsTrigger value="wallet">지갑</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Borrowed Books */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    내가 빌린 책 ({borrowedBooks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {borrowedBooks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        빌린 책이 없습니다
                      </p>
                    ) : (
                      borrowedBooks.map((transaction) => (
                        <div key={transaction.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={transaction.book?.cover_image_url || getDefaultCoverImage()} 
                              alt={transaction.book?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{transaction.book?.title}</h4>
                            <p className="text-xs text-muted-foreground">{transaction.book?.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(transaction.status)}
                              {transaction.rental_end_date && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(transaction.rental_end_date).toLocaleDateString()}까지
                                </span>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/books/${transaction.book?.id}`)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lent Books */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    내가 빌려준 책 ({lentBooks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {lentBooks.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        빌려준 책이 없습니다
                      </p>
                    ) : (
                      lentBooks.map((transaction) => (
                        <div key={transaction.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={transaction.book?.cover_image_url || getDefaultCoverImage()} 
                              alt={transaction.book?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{transaction.book?.title}</h4>
                            <p className="text-xs text-muted-foreground">{transaction.book?.author}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(transaction.status)}
                              {transaction.total_amount && (
                                <span className="text-xs font-medium text-green-600">
                                  +{formatCurrency(transaction.total_amount)}
                                </span>
                              )}
                            </div>
                            {transaction.borrower?.display_name && (
                              <p className="text-xs text-muted-foreground">
                                대여자: {transaction.borrower.display_name}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/books/${transaction.book?.id}`)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => navigate("/add-book")} className="w-full max-w-md">
                <Plus className="h-4 w-4 mr-2" />
                새 책 등록하기
              </Button>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            {/* Balance Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  내 지갑
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-2">현재 잔액</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(wallet?.balance || 0)}
                  </p>
                </div>
                <Button className="w-full" size="lg">
                  <CreditCard className="h-4 w-4 mr-2" />
                  충전하기
                </Button>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle>거래 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {walletTransactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      거래 내역이 없습니다
                    </p>
                  ) : (
                    walletTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.transaction_type)}
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.description || 
                                (transaction.transaction_type === 'charge' ? '충전' :
                                 transaction.transaction_type === 'payment' ? '결제' : '수익')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`font-medium ${
                          transaction.transaction_type === 'charge' || transaction.transaction_type === 'earning' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'payment' ? '-' : '+'}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">푸시 알림</p>
                    <p className="text-sm text-muted-foreground">새로운 대여 요청과 메시지 알림을 받습니다</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">이메일 알림</p>
                    <p className="text-sm text-muted-foreground">중요한 업데이트를 이메일로 받습니다</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  앱 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">언어</p>
                      <p className="text-sm text-muted-foreground">한국어</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">변경</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">위치 설정</p>
                      <p className="text-sm text-muted-foreground">{profile?.address || "설정되지 않음"}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">변경</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  계정 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  프로필 수정
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  개인정보 처리방침
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  서비스 이용약관
                </Button>
                <Separator />
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MyPage;