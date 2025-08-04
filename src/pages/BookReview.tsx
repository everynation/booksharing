import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url?: string;
}

interface Review {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
}

const BookReview = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !bookId) return;
    
    fetchBookData();
    fetchReviews();
    checkReviewPermission();
  }, [user, bookId]);

  const fetchBookData = async () => {
    if (!bookId) return;
    
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, cover_image_url")
      .eq("id", bookId)
      .single();

    if (error) {
      toast({
        title: "오류",
        description: "책 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setBook(data);
  };

  const fetchReviews = async () => {
    if (!bookId) return;
    
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "오류",
        description: "리뷰를 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    const currentUserReview = data?.find(review => review.user_id === user?.id);
    const otherReviews = data?.filter(review => review.user_id !== user?.id) || [];
    
    setUserReview(currentUserReview || null);
    setReviews(otherReviews);
    
    if (currentUserReview) {
      setContent(currentUserReview.content);
      setRating(currentUserReview.rating);
    }
  };

  const checkReviewPermission = async () => {
    if (!user || !bookId) return;
    
    const { data, error } = await supabase.rpc("can_user_review_book", {
      book_id_param: bookId,
      user_id_param: user.id,
    });

    if (error) {
      console.error("Error checking review permission:", error);
      setCanReview(false);
    } else {
      setCanReview(data);
    }
    
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user || !bookId || !content.trim()) return;

    if (userReview) {
      // Update existing review
      const { error } = await supabase
        .from("reviews")
        .update({
          content: content.trim(),
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userReview.id);

      if (error) {
        toast({
          title: "오류",
          description: "독후감 수정에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: "독후감이 수정되었습니다.",
      });
    } else {
      // Create new review
      const { error } = await supabase
        .from("reviews")
        .insert({
          book_id: bookId,
          user_id: user.id,
          content: content.trim(),
          rating,
        });

      if (error) {
        toast({
          title: "오류",
          description: "독후감 작성에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "성공",
        description: "독후감이 작성되었습니다.",
      });
    }

    setIsEditing(false);
    fetchReviews();
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", userReview.id);

    if (error) {
      toast({
        title: "오류",
        description: "독후감 삭제에 실패했습니다.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "성공",
      description: "독후감이 삭제되었습니다.",
    });

    setUserReview(null);
    setContent("");
    setRating(5);
    fetchReviews();
  };

  const renderStars = (rating: number, editable = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            } ${editable ? "cursor-pointer hover:scale-110" : ""}`}
            onClick={() => editable && setRating(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="text-center">책을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/books/${bookId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          책 상세로 돌아가기
        </Button>

        {/* Book Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              {book.cover_image_url && (
                <img
                  src={book.cover_image_url}
                  alt={book.title}
                  className="w-20 h-28 object-cover rounded"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{book.title}</h1>
                <p className="text-muted-foreground">{book.author}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Write/Edit Review */}
        {canReview && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {userReview ? "내 독후감" : "독후감 작성"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditing && userReview ? (
                <div className="space-y-4">
                  <div>
                    <Label>평점</Label>
                    {renderStars(userReview.rating)}
                  </div>
                  <div>
                    <Label>독후감</Label>
                    <p className="mt-2 text-foreground whitespace-pre-wrap">
                      {userReview.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      수정
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteReview}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>평점</Label>
                    <div className="mt-2">
                      {renderStars(rating, true)}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="content">독후감</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="이 책을 읽고 느낀 점을 자유롭게 적어보세요..."
                      className="mt-2 min-h-[200px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitReview}
                      disabled={!content.trim()}
                    >
                      {userReview ? "수정하기" : "작성하기"}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (userReview) {
                            setContent(userReview.content);
                            setRating(userReview.rating);
                          }
                        }}
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!canReview && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                이 책의 독후감을 작성하려면 책을 소유하고 있거나, 구매했거나, 대여한 기록이 있어야 합니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Other Reviews */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">다른 독자들의 독후감</h2>
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">아직 작성된 독후감이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        익명
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">
                    {review.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BookReview;
