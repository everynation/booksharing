import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface BookWithoutLocation {
  id: string;
  title: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface UpdateResult {
  bookId: string;
  title: string;
  success: boolean;
  error?: string;
}

export const BulkLocationUpdate: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookWithoutLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UpdateResult[]>([]);

  useEffect(() => {
    if (user) {
      fetchBooksWithoutLocation();
    }
  }, [user]);

  const fetchBooksWithoutLocation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('books')
        .select('id, title, address, latitude, longitude')
        .eq('user_id', user.id)
        .or('latitude.is.null,longitude.is.null')
        .not('address', 'is', null);

      if (error) throw error;

      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "책 목록 로딩 실패",
        description: "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAllLocations = async () => {
    if (!books.length) return;

    try {
      setUpdating(true);
      setProgress(0);
      setResults([]);

      const updateResults: UpdateResult[] = [];

      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        
        try {
          const { data, error } = await supabase.functions.invoke('update-book-location', {
            body: {
              book_id: book.id,
              address: book.address
            }
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || '위치 업데이트 실패');
          }

          updateResults.push({
            bookId: book.id,
            title: book.title,
            success: true
          });

        } catch (error) {
          updateResults.push({
            bookId: book.id,
            title: book.title,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류'
          });
        }

        setProgress(((i + 1) / books.length) * 100);
        setResults([...updateResults]);

        // API 호출 간격 조정 (카카오 API 제한 고려)
        if (i < books.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const successCount = updateResults.filter(r => r.success).length;
      const failCount = updateResults.filter(r => !r.success).length;

      toast({
        title: "위치 업데이트 완료",
        description: `성공: ${successCount}개, 실패: ${failCount}개`,
      });

      // 목록 새로고침
      fetchBooksWithoutLocation();

    } catch (error) {
      console.error('Error updating locations:', error);
      toast({
        title: "업데이트 실패",
        description: "일괄 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>책 목록을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!books.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">모든 책의 위치가 설정되었습니다</h3>
            <p className="text-muted-foreground">
              등록된 모든 책에 위치 정보가 있어 지도에서 확인할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          책 위치 정보 일괄 업데이트
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          주소 정보가 있지만 위치 좌표가 없는 {books.length}개 책의 위치를 설정합니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {updating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>진행률</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {results.map((result) => (
              <div 
                key={result.bookId} 
                className="flex items-center gap-2 text-sm p-2 rounded border"
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="flex-1">{result.title}</span>
                {!result.success && result.error && (
                  <span className="text-red-500 text-xs">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={updateAllLocations}
          disabled={updating || !books.length}
          className="w-full"
        >
          {updating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              위치 정보 업데이트 중...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              {books.length}개 책 위치 설정하기
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};