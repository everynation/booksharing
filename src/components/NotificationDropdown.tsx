import React, { useState, useEffect } from 'react';
import { Bell, Check, X, User } from 'lucide-react';
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
          <Bell className="h-4 w-4" />
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
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto" align="end">
        <DropdownMenuLabel className="text-sm font-semibold">
          대여 요청 ({pendingRequests.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {pendingRequests.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            새로운 대여 요청이 없습니다
          </div>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="p-3 border-b last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {request.borrower?.display_name || '익명'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    "{request.book?.title}" 대여 요청
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(request.created_at)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs"
                      onClick={() => handleRequestResponse(request.id, 'approved')}
                      disabled={loading}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
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
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};