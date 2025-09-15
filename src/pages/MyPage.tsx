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
  ArrowDownLeft,
  Navigation,
  Camera,
  Upload,
  Gift,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "@/hooks/use-toast";
import { SimpleAddressInput } from "@/components/SimpleAddressInput";
import { CurrentLocationButton } from "@/components/CurrentLocationButton";
import Header from "@/components/Header";

interface Profile {
  display_name: string | null;
  address: string | null;
  phone: string | null;
  avatar_url: string | null;
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

interface RewardClaim {
  id: string;
  status: string;
  total_reward_value: number;
  eligible_books: any[];
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

const MyPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { latitude, longitude, getCurrentPosition, loading: locationLoading, error: locationError } = useGeolocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([]);
  const [lentBooks, setLentBooks] = useState<LentBook[]>([]);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState("");

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
        .select('display_name, address, phone, avatar_url')
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

      // Fetch borrowed books (실제로 승인된 대여만 포함)
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
        .in('status', ['approved', 'in_progress', 'pending_return', 'return_requested', 'completed'])
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

      // Fetch reward claims
      const { data: rewardData } = await supabase
        .from('reward_claims')
        .select('id, status, total_reward_value, eligible_books, delivery_address, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rewardData) {
        setRewardClaims(rewardData.map(claim => ({
          ...claim,
          eligible_books: Array.isArray(claim.eligible_books) ? claim.eligible_books : []
        })));
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

  const getRewardStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">신청 중</Badge>;
      case 'processing':
        return <Badge variant="secondary">처리 중</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500">배송 중</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">배송 완료</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Location handling functions
  const handleUseCurrentLocation = async () => {
    if (!user) return;
    
    if (locationLoading) {
      toast({
        title: "위치 확인 중",
        description: "현재 위치를 확인하고 있습니다. 잠시만 기다려주세요.",
      });
      return;
    }

    if (!latitude || !longitude) {
      getCurrentPosition();
      toast({
        title: "위치 권한 요청",
        description: "현재 위치를 가져오기 위해 위치 권한이 필요합니다.",
      });
      return;
    }

    try {
      // Reverse geocoding to get address from coordinates
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { latitude, longitude, reverseGeocode: true }
      });

      if (error) {
        throw error;
      }

      const address = data.address || `위도: ${latitude.toFixed(6)}, 경도: ${longitude.toFixed(6)}`;
      
      await updateUserLocation(address, latitude, longitude);
    } catch (error) {
      console.error('Current location error:', error);
      toast({
        title: "현재 위치 사용 실패",
        description: "현재 위치를 가져올 수 없습니다. 주소를 직접 입력해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleAddressChange = (latitude: number, longitude: number, address: string) => {
    updateUserLocation(address, latitude, longitude);
  };

  const updateUserLocation = async (address: string, lat: number, lng: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          address,
          latitude: lat,
          longitude: lng
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setProfile(prev => prev ? { ...prev, address } : { display_name: null, address, phone: null, avatar_url: null });
      setIsLocationDialogOpen(false);
      
      toast({
        title: "위치 업데이트 완료",
        description: `주소가 "${address}"로 업데이트되었습니다.`,
      });
    } catch (error) {
      console.error('Location update error:', error);
      toast({
        title: "위치 업데이트 실패",
        description: "위치를 업데이트할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "이미지 크기는 5MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: "프로필 사진 업데이트 완료",
        description: "프로필 사진이 성공적으로 변경되었습니다.",
      });

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "프로필 사진 업로드 실패",
        description: "프로필 사진을 업로드할 수 없습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleCalculateRewards = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('calculate-book-rewards', {
        body: { user_id: user.id }
      });

      if (error) {
        throw error;
      }

      if (data.total_reward > 0) {
        toast({
          title: "보상 포인트 지급 완료!",
          description: `${data.total_reward.toLocaleString()}포인트가 지급되었습니다. (${data.eligible_books.length}권의 도서)`,
        });
        
        // Refresh user data to show updated wallet balance
        fetchUserData();
      } else {
        toast({
          title: "보상 대상 도서 없음",
          description: data.message || "현재 보상 대상인 도서가 없습니다.",
          variant: "default",
        });
      }

    } catch (error: any) {
      console.error('Reward calculation error:', error);
      toast({
        title: "보상 계산 실패",
        description: error.message || "보상을 계산하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {profile?.display_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
                     onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
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
          <TabsList className="grid w-full grid-cols-4 h-12 p-1 bg-muted rounded-lg">
            <TabsTrigger 
              value="activity" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              내 활동
            </TabsTrigger>
            <TabsTrigger 
              value="rewards" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              보상 현황
            </TabsTrigger>
            <TabsTrigger 
              value="wallet" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              지갑
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              설정
            </TabsTrigger>
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
                                  +{transaction.total_amount.toLocaleString()}P
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

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  포인트 보상 시스템
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  대여 수익이 책 가격을 초과한 도서에 대해 해당 책 가격만큼 포인트를 지급받으세요
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button 
                    onClick={handleCalculateRewards}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {loading ? "계산 중..." : "보상 포인트 계산하기"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  보상 신청 현황 ({rewardClaims.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {rewardClaims.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        보상 신청 내역이 없습니다
                      </p>
                    </div>
                  ) : (
                    rewardClaims.map((claim) => (
                      <div key={claim.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-primary" />
                            <span className="font-medium">보상 신청</span>
                          </div>
                          {getRewardStatusBadge(claim.status)}
                        </div>
                        
                         <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">지급된 포인트</p>
                            <p className="font-medium text-primary">
                              {claim.total_reward_value.toLocaleString()}P
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">신청일</p>
                            <p className="font-medium">
                              {formatDate(claim.created_at)}
                            </p>
                          </div>
                        </div>

                        {claim.delivery_address && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">배송 주소</p>
                            <p className="font-medium">{claim.delivery_address}</p>
                          </div>
                        )}

                        <div className="text-sm">
                          <p className="text-muted-foreground">대상 도서 ({claim.eligible_books.length}권)</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {claim.eligible_books.slice(0, 3).map((book: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {book.title}
                              </Badge>
                            ))}
                            {claim.eligible_books.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{claim.eligible_books.length - 3}권 더
                              </Badge>
                            )}
                          </div>
                        </div>

                        {claim.status === 'shipped' && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                              📦 상품이 배송 중입니다
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              곧 배송지로 도착할 예정입니다
                            </p>
                          </div>
                        )}

                        {claim.status === 'delivered' && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                              ✅ 배송이 완료되었습니다
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {formatDate(claim.updated_at)}에 배송 완료
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reward Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  보상 시스템 안내
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>📚 <strong>보상 조건:</strong> 대여 수익이 책 가격을 초과한 도서</p>
                  <p>🎁 <strong>보상 내용:</strong> 새 책으로 교환 또는 현금 지급</p>
                  <p>🚚 <strong>배송:</strong> 신청 후 3-5일 내 처리</p>
                  <p>📍 <strong>배송지:</strong> 프로필 주소 또는 별도 지정</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate("/reward-notification")}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  보상 확인 및 신청
                </Button>
              </CardContent>
            </Card>
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
                    {(wallet?.balance || 0).toLocaleString()}P
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
                          {Math.abs(transaction.amount).toLocaleString()}P
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
                  <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">변경</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          위치 설정
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          현재 위치를 사용하거나 주소를 직접 입력하여 위치를 설정할 수 있습니다.
                        </div>
                        

                        {/* Address Input with Current Location */}
                        <SimpleAddressInput
                          onLocationSelect={handleAddressChange}
                          placeholder="주소를 검색하여 설정"
                          showLocationPicker={true}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
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