import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Star, Clock, Filter, Eye, Edit, Map, List, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider as UISlider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "@/hooks/use-toast";
import { checkUserCanBorrow } from "@/lib/rentalUtils";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { SimpleAddressInput } from "@/components/SimpleAddressInput";
import { KakaoMap } from "@/components/KakaoMap";
import Header from "@/components/Header";

interface BookProfile {
  display_name: string | null;
  address: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_image_url: string | null;
  transaction_type: string;
  price: number;
  status: string;
  created_at: string;
  description: string | null;
  rental_daily: number | null;
  weekly_rate: number | null;
  rental_weekly: number | null;
  daily_rate: number | null;
  late_daily: number | null;
  late_fee_per_day: number | null;
  new_book_price: number | null;
  rental_terms: string | null;
  for_rental: boolean | null;
  for_sale: boolean | null;
  profiles: BookProfile | null;
  distance?: number;
}

interface MapMarker {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  transaction_type: string;
}

const BooksWithMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { latitude: userLat, longitude: userLng, getCurrentPosition, loading: locationLoading, error: locationError } = useGeolocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "sale" | "rental">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "price" | "title" | "distance">("created_at");
  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [distanceFilter, setDistanceFilter] = useState([20]); // km
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number; lng: number} | null>(null);

  // Request user location on component mount
  useEffect(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  // Set map center when user location is available
  useEffect(() => {
    if (userLat && userLng) {
      setMapCenter({ lat: userLat, lng: userLng });
    }
  }, [userLat, userLng]);

  useEffect(() => {
    fetchBooks();
  }, [transactionTypeFilter, sortBy]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // Fetch books with secure data - no sensitive user info exposed
      let query = supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          isbn,
          cover_image_url,
          transaction_type,
          price,
          status,
          created_at,
          description,
          rental_daily,
          weekly_rate,
          rental_weekly,
          daily_rate,
          late_daily,
          late_fee_per_day,
          new_book_price,
          rental_terms,
          for_rental,
          for_sale
        `)
        .eq('status', 'available');

      // Apply transaction type filter
      if (transactionTypeFilter !== "all") {
        query = query.eq('transaction_type', transactionTypeFilter);
      }

      // Apply sorting (distance sorting will be done after fetch)
      if (sortBy !== "distance") {
        const ascending = sortBy === "title";
        query = query.order(sortBy, { ascending });
      }

      const { data: booksData, error } = await query;

      if (error) {
        console.error('Error fetching books:', error);
        toast({
          title: "책 목록 로딩 실패",
          description: "책 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      if (!booksData || booksData.length === 0) {
        setBooks([]);
        return;
      }

      // For secure browsing, only show basic book info without user identification
      // RLS policies protect sensitive data like user_id and location coordinates
      const booksWithSecureInfo = booksData.map(book => ({
        ...book,
        profiles: {
          display_name: "익명", // Hide owner identity for security
          address: "위치 정보 보호됨" // General indicator only, no exact location
        }
      }));

      setBooks(booksWithSecureInfo as any);
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

  const handleBorrowRequest = async (bookId: string) => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "대여 요청을 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Note: Cannot check ownership without user_id access due to security policies
    // Backend will handle validation

    // Check if user can borrow (no pending transactions)
    const { canBorrow } = await checkUserCanBorrow(user.id);
    if (!canBorrow) {
      navigate("/rental-restriction");
      return;
    }

    try {
      // Create transaction using secure edge function
      const { data, error } = await supabase.functions.invoke('create-secure-transaction', {
        body: {
          book_id: bookId,
          borrower_id: user.id,
          status: 'requested'
        }
      });

      if (error || !data?.success) {
        toast({
          title: "대여 요청 실패",
          description: data?.error || error?.message || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "대여 요청 완료",
        description: "직접 만나서 거래하세요. 책 주인에게 연락하여 만날 장소와 시간을 정하세요.",
      });
      
      // Update book status to rented
      await supabase
        .from('books')
        .update({ status: 'rented' })
        .eq('id', bookId);
      
      // Refresh books list
      fetchBooks();
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = books.filter(book => {
      // Text search filter
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });

    // Sort books
    if (sortBy === "distance") {
      filtered = filtered.sort((a, b) => {
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else if (sortBy === "title") {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "price") {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else {
      filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [books, searchQuery, distanceFilter, sortBy, userLat, userLng]);

  // Map functionality is temporarily disabled for security
  // Location data is now protected and not available for public access
  const mapMarkers: MapMarker[] = useMemo(() => {
    return []; // No map markers since location data is protected
  }, []);

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedBookId(marker.id);
    setActiveTab("list");
    // Scroll to the book in list
    setTimeout(() => {
      const element = document.getElementById(`book-${marker.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleAddressSearch = (latitude: number, longitude: number, address: string) => {
    setMapCenter({ lat: latitude, lng: longitude });
    setActiveTab("map");
    toast({
      title: "지도 위치 이동",
      description: `${address} 주변 지도로 이동했습니다.`,
    });
  };

  const getDefaultCoverImage = () => {
    return "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=400&fit=crop&crop=center";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* 검색 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            이웃의 책 찾기
          </h1>
          <p className="text-muted-foreground mb-6">
            지도에서 가까운 이웃이 공유한 책들을 찾아보세요
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="책 제목이나 저자를 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <SimpleAddressInput
              onLocationSelect={handleAddressSearch}
              placeholder="주소 검색으로 지도 이동"
              className="flex-1 max-w-md"
            />
          </div>
        </div>

        {/* 사용자 위치 정보 */}
        {locationLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">📍 현재 위치를 확인하는 중...</p>
          </div>
        )}
        
        {locationError && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">📍 {locationError}</p>
            <Button
              variant="link"
              size="sm"
              onClick={getCurrentPosition}
              className="p-0 h-auto text-orange-700"
            >
              다시 시도
            </Button>
          </div>
        )}

        {userLat && userLng && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              📍 현재 위치 기준으로 거리가 표시됩니다
            </p>
          </div>
        )}

        {/* 필터 및 정렬 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Select value={transactionTypeFilter} onValueChange={(value: "all" | "sale" | "rental") => setTransactionTypeFilter(value)}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 유형</SelectItem>
              <SelectItem value="rental">대여</SelectItem>
              <SelectItem value="sale">판매</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: "created_at" | "price" | "title" | "distance") => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <Clock className="h-4 w-4" />
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">최신순</SelectItem>
              <SelectItem value="price">가격순</SelectItem>
              <SelectItem value="title">제목순</SelectItem>
              <SelectItem value="distance" disabled={!userLat || !userLng}>
                거리순 {(!userLat || !userLng) && "(위치 필요)"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 거리 필터 */}
          {userLat && userLng && (
            <div className="flex items-center gap-3 p-2 border rounded-lg min-w-[200px]">
              <Label className="text-sm whitespace-nowrap">반경:</Label>
              <UISlider
                value={distanceFilter}
                onValueChange={setDistanceFilter}
                max={50}
                min={1}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium min-w-[40px]">
                {distanceFilter[0]}km
              </span>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "list" | "map")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              목록 ({filteredAndSortedBooks.length})
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              지도 ({mapMarkers.length})
            </TabsTrigger>
          </TabsList>

          {/* 목록 보기 */}
          <TabsContent value="list" className="mt-6">
            {/* 로딩 상태 */}
            {loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">책 목록을 불러오는 중...</p>
              </div>
            )}

            {/* 책 목록 */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedBooks.map((book) => (
                  <Card 
                    key={book.id} 
                    id={`book-${book.id}`}
                    className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                      selectedBookId === book.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    <CardHeader className="p-0">
                      <div className="aspect-[3/4] bg-muted relative">
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
                          <div className="absolute bottom-2 right-2">
                            <div className="relative">
                              <img 
                                src={book.cover_image_url} 
                                alt="DB 표지"
                                className="w-12 h-16 object-cover rounded border border-white shadow-md"
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
                        
                        <div className="absolute top-2 right-2">
                          <Badge variant={book.transaction_type === "sale" ? "destructive" : "secondary"}>
                            {book.transaction_type === "sale" ? "판매" : "대여"}
                          </Badge>
                        </div>
                        {book.status !== 'available' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="outline" className="bg-background">
                              {book.status === 'rented' ? '대여중' : '판매완료'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-4">
                      <CardTitle className="text-lg mb-2 line-clamp-1">
                        {book.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                      {book.isbn && (
                        <p className="text-xs text-muted-foreground mb-3">ISBN: {book.isbn}</p>
                      )}
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            소유자: {book.profiles?.display_name || "익명"}
                          </span>
                          <span className="font-semibold text-primary">
                            {book.price.toLocaleString()}원{book.transaction_type === "rental" ? "/일" : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          {book.profiles?.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{book.profiles.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0">
                      {false ? (
                        // 내가 등록한 책인 경우 - 보기/수정 버튼
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/books/${book.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            보기
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/edit-book/${book.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            수정
                          </Button>
                        </div>
                      ) : (
                        // 다른 사용자의 책인 경우 - 대여/구매 요청 버튼
                        <Button 
                          className="w-full" 
                          variant={book.status === 'available' ? "warm" : "ghost"}
                          disabled={book.status !== 'available'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBorrowRequest(book.id);
                          }}
                        >
                          {book.status === 'available' 
                            ? `${book.transaction_type === "sale" ? "구매" : "대여"} 요청`
                            : (book.status === 'rented' ? '대여중' : '판매완료')
                          }
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {!loading && filteredAndSortedBooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery || (userLat && userLng && distanceFilter[0] < 20)
                    ? "검색 조건에 맞는 책이 없습니다. 검색어나 거리 필터를 조정해보세요."
                    : "등록된 책이 없습니다. 첫 번째 책을 등록해보세요!"
                  }
                </p>
              </div>
            )}
          </TabsContent>

          {/* 지도 보기 */}
          <TabsContent value="map" className="mt-6">
            <div className="h-[600px] w-full rounded-lg overflow-hidden border">
              <KakaoMap
                markers={mapMarkers}
                onMarkerClick={handleMarkerClick}
                center={mapCenter || undefined}
                className="h-full w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BooksWithMap;