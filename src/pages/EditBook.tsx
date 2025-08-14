import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface BookData {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  transaction_type: string;
  price: number;
  status: string;
  cover_image_url: string | null;
  user_id: string;
}

const EditBook = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    transaction_type: "rental",
    price: 0,
    status: "available"
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isLoadingBookInfo, setIsLoadingBookInfo] = useState(false);
  const [autoCoverUrl, setAutoCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate("/my");
      return;
    }
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchBookData();
  }, [id, user, navigate]);

  const fetchBookData = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);

      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (bookError) {
        console.error('Error fetching book:', bookError);
        toast({
          title: "책 정보 로딩 실패",
          description: "책 정보를 불러올 수 없습니다.",
          variant: "destructive",
        });
        navigate("/my");
        return;
      }

      if (!bookData) {
        toast({
          title: "접근 권한 없음",
          description: "이 책을 수정할 권한이 없습니다.",
          variant: "destructive",
        });
        navigate("/my");
        return;
      }

      const book = bookData as unknown as BookData;
      
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || "",
        description: book.description || "",
        transaction_type: book.transaction_type,
        price: book.price,
        status: book.status
      });
      
      setExistingImageUrl(book.cover_image_url);
      setImagePreview(book.cover_image_url);

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

  const fetchBookInfo = async (isbn: string) => {
    setIsLoadingBookInfo(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-book', {
        body: { isbn }
      });
      if (error) throw new Error(error.message);
      if (data?.documents?.length) {
        const book = data.documents[0];
        if (book.thumbnail && book.thumbnail !== '/placeholder.svg') {
          setAutoCoverUrl(book.thumbnail);
          setImagePreview(book.thumbnail);
          toast({ title: '표지 자동 적용', description: 'ISBN으로 표지를 설정했습니다.' });
        }
      }
    } catch (err: any) {
      console.error('Error fetching book info:', err);
      toast({ title: '표지 불러오기 실패', description: 'ISBN으로 표지를 불러오지 못했습니다.', variant: 'destructive' });
    } finally {
      setIsLoadingBookInfo(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;

    try {
      setSaving(true);

      let coverImageUrl = existingImageUrl;

      // 새 이미지가 업로드된 경우
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(fileName, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(fileName);

        coverImageUrl = publicUrl;
      }

      if (!imageFile && autoCoverUrl) {
        coverImageUrl = autoCoverUrl;
      }

      // 책 정보 업데이트
      const { error: updateError } = await supabase
        .from('books')
        .update({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn || null,
          description: formData.description || null,
          transaction_type: formData.transaction_type,
          price: formData.price,
          status: formData.status,
          cover_image_url: coverImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "수정 완료",
        description: "책 정보가 성공적으로 수정되었습니다.",
      });

      navigate("/my");

    } catch (error: any) {
      console.error('Error updating book:', error);
      toast({
        title: "수정 실패",
        description: error.message || "책 정보 수정에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    
    if (!confirm("정말로 이 책을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setDeleting(true);

      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      toast({
        title: "삭제 완료",
        description: "책이 성공적으로 삭제되었습니다.",
      });

      navigate("/my");

    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast({
        title: "삭제 실패",
        description: error.message || "책 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">책 정보를 불러오는 중...</p>
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
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/my")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              내 책장으로
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>책 정보 수정</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Book Cover Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cover-image">책 표지 이미지</Label>
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
                            setImagePreview(existingImageUrl);
                            setAutoCoverUrl(null);
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
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">책 제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author">저자 *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>

                {/* ISBN */}
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    onBlur={() => formData.isbn && fetchBookInfo(formData.isbn)}
                    placeholder="978-0-000000-0-0"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">책 소개</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="책에 대한 간단한 소개를 작성해주세요"
                    rows={4}
                  />
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label htmlFor="transaction-type">거래 유형 *</Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rental">대여</SelectItem>
                      <SelectItem value="sale">판매</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">가격 *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.transaction_type === "rental" ? "일일 대여료" : "판매가"}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">상태 *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">대여/판매 가능</SelectItem>
                      <SelectItem value="rented">대여중</SelectItem>
                      <SelectItem value="sold">판매완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        저장
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EditBook;
