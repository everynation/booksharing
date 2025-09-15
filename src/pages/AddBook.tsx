import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useErrorToast } from "@/hooks/useErrorToast";
import { bookSchema, type BookFormData } from "@/schemas/bookSchema";
import Header from "@/components/Header";
import { ArrowLeft, Upload, BookOpen, Scan } from "lucide-react";
import { ISBNScanner } from "@/components/ISBNScanner";
import { LocationPickerButton } from "@/components/LocationPickerButton";

// Remove the old FormData interface as it's now defined in the schema

const AddBook = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useErrorToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isLoadingBookInfo, setIsLoadingBookInfo] = useState(false);
  const [autoCoverUrl, setAutoCoverUrl] = useState<string | null>(null);
  const [coverSource, setCoverSource] = useState<'library' | 'upload'>('library');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number, address: string} | null>(null);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      transaction_type: "rental",
      price: 0,
      description: "",
      rental_daily: 0,
      weekly_rate: 0,
      late_fee_per_day: 0,
      new_book_price: 0,
      rental_terms: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setAutoCoverUrl(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Remove the old validateForm function - now handled by zod

  const handleSubmit = async (data: BookFormData) => {
    if (!user) {
      showError(new Error("로그인이 필요합니다"), {
        title: "로그인이 필요합니다",
        description: "책을 등록하려면 먼저 로그인해주세요."
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // 사용자 프로필에서 주소 정보 가져오기
      const { data: profileData } = await supabase
        .from('profiles')
        .select('address')
        .eq('user_id', user.id)
        .single();

      const userAddress = profileData?.address;
      if (!userAddress) {
        showError(new Error("주소 정보가 없습니다"), {
          title: "주소 정보가 없습니다",
          description: "프로필에서 주소를 먼저 설정해주세요."
        });
        setLoading(false);
        return;
      }

      let coverImageUrl: string | null = null;

      if (coverSource === 'upload') {
        if (imageFile) {
          coverImageUrl = await uploadImage(imageFile);
          if (!coverImageUrl) {
            showError(new Error("이미지 업로드 실패"), {
              title: "이미지 업로드 실패",
              description: "이미지 업로드 중 오류가 발생했습니다."
            });
            setLoading(false);
            return;
          }
        }
      } else if (coverSource === 'library') {
        coverImageUrl = autoCoverUrl;
      }

      // Use current location if set, otherwise use user's profile address
      const bookAddress = currentLocation?.address || userAddress;
      const latitude = currentLocation?.lat;
      const longitude = currentLocation?.lng;

      // Insert book data with address
      const { error } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: data.title,
          author: data.author,
          isbn: data.isbn || null,
          cover_image_url: coverImageUrl,
          transaction_type: data.transaction_type,
          price: data.price,
          description: data.description || null,
          rental_daily: data.rental_daily || null,
          weekly_rate: data.weekly_rate || null,
          late_fee_per_day: data.late_fee_per_day || null,
          new_book_price: data.new_book_price || null,
          rental_terms: data.rental_terms || null,
          address: bookAddress,
          latitude,
          longitude,
          status: 'available',
        });

      if (error) {
        showError(error, { title: "책 등록 실패" });
      } else {
        showSuccess("책 등록 완료", "책이 성공적으로 등록되었습니다.");
        navigate("/my");
      }
    } catch (error) {
      showError(error, { title: "오류가 발생했습니다" });
    } finally {
      setLoading(false);
    }
  };

  // Remove handleInputChange - now handled by react-hook-form

  const fetchBookInfo = async (isbn: string) => {
    setIsLoadingBookInfo(true);
    try {
      // 1차 시도: Kakao Books API
      console.log('Trying Kakao Books API for ISBN:', isbn);
      const { data: kakaoData, error: kakaoError } = await supabase.functions.invoke('search-book', {
        body: { isbn }
      });

      let bookFound = false;
      let bookData = null;
      let source = '';

      if (!kakaoError && kakaoData?.documents && kakaoData.documents.length > 0) {
        bookData = kakaoData.documents[0];
        source = 'Kakao Books';
        bookFound = true;
        console.log('Book found in Kakao Books:', bookData);
      } else {
        console.log('Book not found in Kakao Books, trying Google Books...');
        
        // 2차 시도: Google Books API
        try {
          const { data: googleData, error: googleError } = await supabase.functions.invoke('search-google-books', {
            body: { isbn }
          });

          if (!googleError && googleData?.documents && googleData.documents.length > 0) {
            bookData = googleData.documents[0];
            source = 'Google Books';
            bookFound = true;
            console.log('Book found in Google Books:', bookData);
          }
        } catch (googleError) {
          console.error('Google Books API error:', googleError);
        }
      }

      if (bookFound && bookData) {
        // 자동으로 폼 데이터 채우기
        form.setValue('title', bookData.title || '');
        form.setValue('author', bookData.authors ? bookData.authors.join(', ') : '');
        form.setValue('isbn', isbn);

        // 책 표지 이미지가 있으면 설정
        if (bookData.thumbnail && bookData.thumbnail !== '/placeholder.svg') {
          setImagePreview(bookData.thumbnail);
          setAutoCoverUrl(bookData.thumbnail);
        }

        showSuccess(
          "책 정보 불러오기 완료",
          `"${bookData.title}" 정보가 ${source}에서 자동으로 입력되었습니다.`
        );
      } else {
        // 두 API 모두에서 책을 찾지 못한 경우
        form.setValue('isbn', isbn);
        
        showError(new Error("책 정보를 찾을 수 없습니다"), {
          title: "책 정보를 찾을 수 없습니다",
          description: "Kakao Books와 Google Books에서 책 정보를 찾을 수 없습니다. 제목, 저자, 가격을 직접 입력해주세요."
        });

        // 추가 안내 메시지
        setTimeout(() => {
          showSuccess("💡 도움말", "근처 도서관이나 서점에서 책 정보를 확인하시거나, 온라인 서점에서 검색해보세요.");
        }, 3000);
      }
    } catch (error) {
      console.error('Error fetching book info:', error);
      showError(error, {
        title: "오류가 발생했습니다",
        description: "책 정보를 불러오는 중 오류가 발생했습니다. 수동으로 입력해주세요."
      });
    } finally {
      setIsLoadingBookInfo(false);
    }
  };

  const handleISBNScan = (isbn: string) => {
    console.log('ISBN scanned:', isbn);
    fetchBookInfo(isbn);
  };

  const handleLocationSelect = (latitude: number, longitude: number, address: string) => {
    setCurrentLocation({ lat: latitude, lng: longitude, address });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">책 등록</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>새 책 등록</CardTitle>
              <CardDescription>
                다른 사용자와 공유할 책 정보를 입력해주세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Book Cover Upload */}
                <div className="space-y-2">
                  <Label>책 표지 선택</Label>
                  <RadioGroup
                    value={coverSource}
                    onValueChange={(v) => {
                      setCoverSource(v as 'library' | 'upload');
                      if (v === 'library') {
                        setImagePreview(autoCoverUrl ?? null);
                      } else if (v === 'upload' && !imageFile) {
                        setImagePreview(null);
                      }
                    }}
                    className="flex flex-row space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="library" id="add-cover-library" />
                      <Label htmlFor="add-cover-library">라이브러리 표지</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upload" id="add-cover-upload" />
                      <Label htmlFor="add-cover-upload">직접 업로드</Label>
                    </div>
                  </RadioGroup>

                  {coverSource === 'library' ? (
                    <div className="flex flex-col items-center gap-3">
                      {autoCoverUrl ? (
                        <div className="relative">
                          <img
                            src={autoCoverUrl}
                            alt="Library cover preview"
                            className="w-32 h-48 object-cover rounded-md border border-border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -top-2 -right-2"
                            onClick={() => {
                              setAutoCoverUrl(null);
                              setImagePreview(null);
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-48 border-2 border-dashed border-border rounded-md flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const isbn = form.getValues('isbn');
                          if (isbn) {
                            fetchBookInfo(isbn);
                          } else {
                            showError(new Error('ISBN 필요'), {
                              title: 'ISBN 필요',
                              description: 'ISBN을 입력한 후 표지를 불러오세요.'
                            });
                          }
                        }}
                        disabled={isLoadingBookInfo}
                      >
                        {isLoadingBookInfo ? '불러오는 중...' : 'ISBN으로 표지 불러오기'}
                      </Button>
                      <p className="text-xs text-muted-foreground">ISBN을 입력/스캔하면 라이브러리 표지를 가져옵니다.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Book cover preview"
                            className="w-32 h-48 object-cover rounded-md border border-border"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -top-2 -right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-48 border-2 border-dashed border-border rounded-md flex items-center justify-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Input
                        id="cover-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>제목 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="책 제목을 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Author */}
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>저자 *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="저자명을 입력하세요"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 {/* ISBN with Scanner */}
                 <FormField
                   control={form.control}
                   name="isbn"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>ISBN *</FormLabel>
                       <div className="flex gap-2">
                         <FormControl>
                           <Input
                             placeholder="ISBN을 입력하거나 스캔하세요"
                             {...field}
                             onBlur={() => field.value && fetchBookInfo(field.value)}
                             disabled={isLoadingBookInfo}
                             className="flex-1"
                           />
                         </FormControl>
                         <Button
                           type="button"
                           variant="outline"
                           onClick={() => setShowScanner(true)}
                           disabled={isLoadingBookInfo}
                           className="px-3"
                         >
                           <Scan className="h-4 w-4" />
                         </Button>
                       </div>
                       <FormMessage />
                       {isLoadingBookInfo && (
                         <p className="text-sm text-muted-foreground">📚 책 정보를 불러오는 중...</p>
                       )}
                       <p className="text-xs text-muted-foreground">
                         💡 책 뒷면의 바코드를 스캔하면 정보가 자동으로 입력됩니다
                       </p>
                     </FormItem>
                   )}
                 />

                 {/* Transaction Type */}
                 <FormField
                   control={form.control}
                   name="transaction_type"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>거래 유형 *</FormLabel>
                       <FormControl>
                         <RadioGroup
                           value={field.value}
                           onValueChange={(value) => field.onChange(value)}
                           className="flex flex-row space-x-6"
                         >
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="rental" id="rental" />
                             <Label htmlFor="rental">대여</Label>
                           </div>
                           <div className="flex items-center space-x-2">
                             <RadioGroupItem value="sale" id="sale" />
                             <Label htmlFor="sale">판매</Label>
                           </div>
                         </RadioGroup>
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 {/* Price */}
                 <FormField
                   control={form.control}
                   name="price"
                   render={({ field }) => (
                     <FormItem>
                       <FormLabel>가격 (원) *</FormLabel>
                       <FormControl>
                         <Input
                           type="number"
                           placeholder="0"
                           {...field}
                           onChange={(e) => field.onChange(Number(e.target.value))}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                {/* Location Selection */}
                <div className="space-y-2">
                  <Label>책 위치 (선택사항)</Label>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      현재 위치를 사용하거나 프로필의 기본 주소가 자동으로 설정됩니다.
                    </div>
                    <LocationPickerButton
                      onLocationSelect={handleLocationSelect}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      현재 위치 사용
                    </LocationPickerButton>
                    {currentLocation && (
                      <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                        📍 {currentLocation.address}
                      </div>
                    )}
                  </div>
                </div>

                 <Button type="submit" disabled={loading} className="w-full" size="lg">
                   {loading ? "등록 중..." : "책 등록하기"}
                 </Button>
               </form>
             </Form>
             </CardContent>
           </Card>
        </div>
      </div>

      {/* ISBN Scanner Modal */}
      <ISBNScanner
        isOpen={showScanner}
        onScan={handleISBNScan}
        onClose={() => setShowScanner(false)}
      />
    </div>
  );
};

export default AddBook;