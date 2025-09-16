import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useErrorToast } from '@/hooks/useErrorToast';
import { sanitizeInput } from '@/lib/sanitization';
import { MeetConfirmDialog } from './MeetConfirmDialog';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  bookId: string;
  bookTitle: string;
  bookImageUrl?: string;
  transactionId?: string;
}

interface Message {
  id: string;
  message: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  transaction_id: string;
}

interface RentalContract {
  id: string;
  status: string;
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  borrower_return_ok: boolean;
  owner_return_ok: boolean;
  book_id: string;
  owner_id: string;
  borrower_id: string;
}

interface RentalHandshake {
  id: string;
  transaction_id: string;
  borrower_confirmed: boolean;
  owner_confirmed: boolean;
  expires_at: string;
  created_at: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  otherUserId,
  bookId,
  bookTitle,
  bookImageUrl,
  transactionId
}) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useErrorToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<{ display_name: string; avatar_url?: string } | null>(null);
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [handshake, setHandshake] = useState<RentalHandshake | null>(null);
  const [showMeetDialog, setShowMeetDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!transactionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showError(error, { title: '메시지 로딩 실패' });
    }
  };

  const fetchOtherUserProfile = async () => {
    if (!transactionId || !user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_safe_profile_for_transaction', {
          profile_user_id: otherUserId,
          requesting_user_id: user.id
        });

      if (error) throw error;
      if (data && data.length > 0) {
        setOtherUserProfile(data[0]);
      }
    } catch (error) {
      console.error('Error fetching other user profile:', error);
    }
  };

  const fetchContract = async () => {
    if (!transactionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('*')
        .eq('book_id', bookId)
        .in('status', ['PENDING', 'ACTIVE'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setContract(data);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
    }
  };

  const fetchHandshake = async () => {
    if (!transactionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('rental_handshakes')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setHandshake(data);
      }
    } catch (error) {
      console.error('Error fetching handshake:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchOtherUserProfile();
      fetchContract();
      fetchHandshake();
    }
  }, [isOpen, transactionId, user]);

  useEffect(() => {
    if (!isOpen || !transactionId) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `transaction_id=eq.${transactionId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    // Subscribe to handshake updates
    const handshakeSubscription = supabase
      .channel(`handshakes:${transactionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_handshakes',
          filter: `transaction_id=eq.${transactionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setHandshake(payload.new as RentalHandshake);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(handshakeSubscription);
    };
  }, [isOpen, transactionId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !transactionId) return;

    const sanitizedMessage = sanitizeInput(newMessage);
    if (!sanitizedMessage) {
      showError(new Error('메시지가 비어있습니다.'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          message: sanitizedMessage,
          sender_id: user.id,
          receiver_id: otherUserId,
          transaction_id: transactionId
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showError(error, { title: '메시지 전송 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleMeetRequest = async () => {
    if (!user || !transactionId) return;

    try {
      const { error } = await supabase
        .from('rental_handshakes')
        .insert({
          transaction_id: transactionId,
          borrower_confirmed: user.id !== otherUserId,
          owner_confirmed: user.id === otherUserId,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15분 후 만료
        });

      if (error) throw error;
      showSuccess('만남 확인 요청을 보냈습니다');
    } catch (error) {
      console.error('Error creating handshake:', error);
      showError(error, { title: '만남 확인 요청 실패' });
    }
  };

  const handleMeetConfirm = async () => {
    if (!user || !handshake) return;

    try {
      const updateData = user.id === otherUserId 
        ? { owner_confirmed: true }
        : { borrower_confirmed: true };

      const { error } = await supabase
        .from('rental_handshakes')
        .update(updateData)
        .eq('id', handshake.id);

      if (error) throw error;
      showSuccess('만남을 확인했습니다');
      setShowMeetDialog(false);
    } catch (error) {
      console.error('Error confirming meet:', error);
      showError(error, { title: '만남 확인 실패' });
    }
  };

  const handleStartRental = async () => {
    if (!user || !bookId) return;

    try {
      const { error } = await supabase.functions.invoke('contract-agree', {
        body: { 
          contract_id: contract?.id,
          book_id: bookId,
          user_type: user.id === contract?.owner_id ? 'owner' : 'borrower'
        }
      });

      if (error) throw error;
      showSuccess('대여가 시작되었습니다');
      fetchContract();
    } catch (error) {
      console.error('Error starting rental:', error);
      showError(error, { title: '대여 시작 실패' });
    }
  };

  const createRentalContract = async () => {
    if (!user || !bookId || !otherUserId) return;

    try {
      const { error } = await supabase.functions.invoke('create-rental-contract', {
        body: {
          book_id: bookId,
          borrower_id: user.id,
          owner_id: otherUserId
        }
      });

      if (error) throw error;
      showSuccess('대여 계약이 생성되었습니다');
      fetchContract();
    } catch (error) {
      console.error('Error creating rental contract:', error);
      showError(error, { title: '대여 계약 생성 실패' });
    }
  };

  const renderRentalButton = () => {
    if (!contract) {
      return (
        <Button onClick={createRentalContract} className="w-full">
          대여 계약 생성
        </Button>
      );
    }

    if (contract.status === 'PENDING') {
      if (user?.id === contract.owner_id && !contract.owner_confirmed) {
        return (
          <Button onClick={handleStartRental} className="w-full">
            대여 동의
          </Button>
        );
      }
      
      if (user?.id === contract.borrower_id && !contract.borrower_confirmed) {
        return (
          <Button onClick={handleStartRental} className="w-full">
            대여 동의
          </Button>
        );
      }

      return (
        <div className="text-center text-sm text-muted-foreground">
          상대방의 동의를 기다리고 있습니다
        </div>
      );
    }

    if (contract.status === 'ACTIVE') {
      return (
        <Badge variant="default" className="w-full justify-center">
          대여 진행중
        </Badge>
      );
    }

    return null;
  };

  const canShowMeetButton = handshake && !handshake.borrower_confirmed && !handshake.owner_confirmed;
  const canConfirmMeet = handshake && 
    ((user?.id === otherUserId && !handshake.owner_confirmed) || 
     (user?.id !== otherUserId && !handshake.borrower_confirmed));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={otherUserProfile?.avatar_url} />
                <AvatarFallback>
                  {otherUserProfile?.display_name?.substring(0, 2) || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {otherUserProfile?.display_name || '알 수 없는 사용자'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {bookTitle}
                </div>
              </div>
              {bookImageUrl && (
                <img 
                  src={bookImageUrl} 
                  alt={bookTitle}
                  className="h-12 w-8 object-cover rounded"
                />
              )}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div>{message.message}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender_id === user?.id 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="space-y-3">
            <Separator />
            
            {/* Meeting and Rental Controls */}
            <div className="space-y-2">
              {canShowMeetButton && (
                <Button 
                  onClick={handleMeetRequest} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  만났습니다
                </Button>
              )}
              
              {canConfirmMeet && (
                <Button 
                  onClick={() => setShowMeetDialog(true)}
                  variant="default" 
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  만남 확인
                </Button>
              )}

              {handshake?.borrower_confirmed && handshake?.owner_confirmed && (
                <div className="space-y-2">
                  <Badge variant="default" className="w-full justify-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    만남 확인 완료
                  </Badge>
                  {renderRentalButton()}
                </div>
              )}
            </div>

            <Separator />

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={loading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={loading || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MeetConfirmDialog
        isOpen={showMeetDialog}
        onOpenChange={setShowMeetDialog}
        onConfirm={handleMeetConfirm}
        otherUserName={otherUserProfile?.display_name || '상대방'}
        bookTitle={bookTitle}
      />
    </>
  );
};