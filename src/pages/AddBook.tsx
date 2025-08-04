import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { ArrowLeft, Upload, BookOpen } from "lucide-react";

interface FormData {
  title: string;
  author: string;
  isbn: string;
  transaction_type: "sale" | "rental";
  price: number;
}

const AddBook = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    author: "",
    isbn: "",
    transaction_type: "rental",
    price: 0,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
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

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "제목을 입력해주세요";
    }

    if (!formData.author.trim()) {
      newErrors.author = "저자를 입력해주세요";
    }

    if (formData.price < 0) {
      newErrors.price = "가격은 0원 이상이어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "책을 등록하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let coverImageUrl = null;

      // Upload image if selected
      if (imageFile) {
        coverImageUrl = await uploadImage(imageFile);
        if (!coverImageUrl) {
          toast({
            title: "이미지 업로드 실패",
            description: "이미지 업로드 중 오류가 발생했습니다.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Insert book data
      const { error } = await supabase
        .from('books')
        .insert({
          user_id: user.id,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn || null,
          cover_image_url: coverImageUrl,
          transaction_type: formData.transaction_type,
          price: formData.price,
          status: 'available',
        });

      if (error) {
        toast({
          title: "책 등록 실패",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "책 등록 완료",
          description: "책이 성공적으로 등록되었습니다.",
        });
        navigate("/my");
      }
    } catch (error) {
      toast({
        title: "오류가 발생했습니다",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    placeholder="책 제목을 입력하세요"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>

                {/* Author */}
                <div className="space-y-2">
                  <Label htmlFor="author">저자 *</Label>
                  <Input
                    id="author"
                    placeholder="저자명을 입력하세요"
                    value={formData.author}
                    onChange={(e) => handleInputChange("author", e.target.value)}
                    className={errors.author ? "border-destructive" : ""}
                  />
                  {errors.author && (
                    <p className="text-sm text-destructive">{errors.author}</p>
                  )}
                </div>

                {/* ISBN */}
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN (선택사항)</Label>
                  <Input
                    id="isbn"
                    placeholder="ISBN을 입력하세요"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange("isbn", e.target.value)}
                  />
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label>거래 유형 *</Label>
                  <RadioGroup
                    value={formData.transaction_type}
                    onValueChange={(value) => handleInputChange("transaction_type", value as "sale" | "rental")}
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
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">가격 (원) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", Number(e.target.value))}
                    className={errors.price ? "border-destructive" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                  variant="warm"
                >
                  {loading ? "등록 중..." : "책 등록하기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddBook;