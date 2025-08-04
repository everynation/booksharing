import React, { useState, useEffect } from 'react';
import { MessageCircle, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface PendingRequest {
  id: string;
  book_id: string;
  borrower_id: string;
  created_at: string;
  book: {
    title: string;
    author: string;
  };
  borrower: {
    display_name: string;
  };
}

export const NotificationDropdown = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPendingRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          book_id,
          borrower_id,
          created_at,
          books!inner (
            title,
            author
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'requested')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending requests:', error);
        return;
      }

      // Get borrower profiles separately
      const borrowerIds = data?.map(item => item.borrower_id) || [];
      let profiles: any[] = [];
      
      if (borrowerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', borrowerIds);
        profiles = profilesData || [];
      }

      // Map the data to match our interface
      const mappedData = data?.map(item => ({
        id: item.id,
        book_id: item.book_id,
        borrower_id: item.borrower_id,
        created_at: item.created_at,
        book: {
          title: item.books?.title || '',
          author: item.books?.author || ''
        },
        borrower: {
          display_name: profiles.find(p => p.user_id === item.borrower_id)?.display_name || '익명'
        }
      })) || [];

      setPendingRequests(mappedData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, [user]);

  const handleRequestResponse = async (requestId: string, action: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: action })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      toast({
        title: action === 'approved' ? '요청이 승인되었습니다' : '요청이 거절되었습니다',
        description: action === 'approved' ? '대여가 승인되었습니다.' : '대여 요청이 거절되었습니다.',
      });

      // 요청 목록 새로고침
      fetchPendingRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: '오류가 발생했습니다',
        description: '요청 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <MessageCircle className="h-4 w-4" />
          {pendingRequests.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {pendingRequests.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 max-h-[500px] overflow-y-auto" align="end">
        <DropdownMenuLabel className="text-sm font-semibold bg-accent/50 py-3 px-4 border-b">
          💬 메시지 ({pendingRequests.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {pendingRequests.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            새로운 메시지가 없습니다
          </div>
        ) : (
          pendingRequests.map((request, index) => (
            <div key={request.id} className={`p-4 hover:bg-accent/30 transition-colors ${index !== pendingRequests.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {request.borrower?.display_name || '익명'}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">
                      안녕하세요! 📚 <strong>"{request.book?.title}"</strong> 책을 대여하고 싶습니다. 
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(request.created_at)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs px-3 bg-green-600 hover:bg-green-700"
                        onClick={() => handleRequestResponse(request.id, 'approved')}
                        disabled={loading}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs px-3 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleRequestResponse(request.id, 'rejected')}
                        disabled={loading}
                      >
                        <X className="h-3 w-3 mr-1" />
                        거절
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};