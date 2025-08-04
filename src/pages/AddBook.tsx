import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { ArrowLeft, Upload, BookOpen } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  author: z.string().min(1, "저자를 입력해주세요"),
  isbn: z.string().optional(),
  transaction_type: z.enum(["sale", "rental"], {
    required_error: "거래 유형을 선택해주세요",
  }),
  price: z.number().min(0, "가격은 0원 이상이어야 합니다"),
});

type FormData = z.infer<typeof formSchema>;

const AddBook = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      transaction_type: "rental",
      price: 0,
    },
  });

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

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        description: "책을 등록하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      navigate("/auth");
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
          title: data.title,
          author: data.author,
          isbn: data.isbn || null,
          cover_image_url: coverImageUrl,
          transaction_type: data.transaction_type,
          price: data.price,
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>제목 *</FormLabel>
                        <FormControl>
                          <Input placeholder="책 제목을 입력하세요" {...field} />
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
                          <Input placeholder="저자명을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ISBN */}
                  <FormField
                    control={form.control}
                    name="isbn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISBN (선택사항)</FormLabel>
                        <FormControl>
                          <Input placeholder="ISBN을 입력하세요" {...field} />
                        </FormControl>
                        <FormMessage />
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
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    variant="warm"
                  >
                    {loading ? "등록 중..." : "책 등록하기"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddBook;