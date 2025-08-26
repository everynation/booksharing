import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X, Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { sanitizeChatMessage } from '@/lib/sanitization';
import { useNavigate } from 'react-router-dom';
import { MeetConfirmDialog } from './MeetConfirmDialog';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  bookTitle: string;
  bookId: string;
  transactionId: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
}

interface RentalContract {
  id: string;
  status: string;
  owner_id: string;
  borrower_id: string;
  owner_confirmed: boolean;
  borrower_confirmed: boolean;
}

interface RentalHandshake {
  id: string;
  transaction_id: string;
  owner_confirmed: boolean;
  borrower_confirmed: boolean;
  expires_at: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  bookTitle,
  bookId,
  transactionId
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<RentalContract | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [handshake, setHandshake] = useState<RentalHandshake | null>(null);
  const [showMeetDialog, setShowMeetDialog] = useState(false);
  const [isHandshakeInitiator, setIsHandshakeInitiator] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 대여 계약 정보 가져오기
  const fetchContract = async () => {
    if (!user || !bookId) return;

    try {
      const { data, error } = await supabase
        .from('rental_contracts')
        .select('id, status, owner_id, borrower_id, owner_confirmed, borrower_confirmed')
        .eq('book_id', bookId)
        .or(`owner_id.eq.${user.id},borrower_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching contract:', error);
        return;
      }

      setContract(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 핸드셰이크 정보 가져오기
  const fetchHandshake = async () => {
    if (!user || !transactionId) return;

    try {
      const { data, error } = await supabase
        .from('rental_handshakes')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching handshake:', error);
        return;
      }

      setHandshake(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 실제 메시지 목록 가져오기
  const fetchMessages = async () => {
    if (!user || !transactionId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message,
          created_at
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // 프로필 정보와 함께 메시지 매핑
      const messagesWithNames: Message[] = (data || []).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        message: msg.message,
        created_at: msg.created_at,
        sender_name: msg.sender_id === user.id ? '나' : otherUserName
      }));

      // 메시지가 없으면 초기 메시지 생성
      if (messagesWithNames.length === 0) {
        const initialMessage = `📚 "${bookTitle}" 책을 대여하고 싶습니다.`;
        
        // DB에 초기 메시지 저장
        const { data: newMessageData, error: insertError } = await supabase
          .from('messages')
          .insert({
            transaction_id: transactionId,
            sender_id: otherUserId, // 요청자(borrower)가 보낸 것으로 설정
            receiver_id: user.id,
            message: initialMessage
          })
          .select()
          .single();

        if (!insertError && newMessageData) {
          messagesWithNames.push({
            id: newMessageData.id,
            sender_id: newMessageData.sender_id,
            message: newMessageData.message,
            created_at: newMessageData.created_at,
            sender_name: otherUserName
          });
        }
      }

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchMessages();
      fetchContract();
      fetchHandshake();
      
      // 실시간 메시지 구독 설정
      const messagesChannel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `transaction_id=eq.${transactionId}`
          },
          (payload) => {
            const newMessage: Message = {
              id: payload.new.id,
              sender_id: payload.new.sender_id,
              message: payload.new.message,
              created_at: payload.new.created_at,
              sender_name: payload.new.sender_id === user.id ? '나' : otherUserName
            };
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();

      // 핸드셰이크 실시간 구독 설정
      const handshakeChannel = supabase
        .channel('handshake-changes')
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
              const handshakeData = payload.new as RentalHandshake;
              setHandshake(handshakeData);
              
              // 새로운 핸드셰이크가 생성되었고 현재 사용자가 생성자가 아닌 경우 팝업 표시
              if (payload.eventType === 'INSERT') {
                setIsHandshakeInitiator(false);
                setShowMeetDialog(true);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(handshakeChannel);
      };
    }
  }, [isOpen, user, transactionId, otherUserName]);

  useEffect(() => {
    // 새 메시지가 추가될 때 스크롤을 맨 아래로
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          setTimeout(() => {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }, 100);
        }
      }
    };

    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || loading) return;

    const messageText = sanitizeChatMessage(newMessage.trim());
    setNewMessage(''); // 즉시 입력창 비우기
    setLoading(true);

    try {
      // DB에 메시지 저장 (실시간 구독으로 자동 업데이트됨)
      const { error } = await supabase
        .from('messages')
        .insert({
          transaction_id: transactionId,
          sender_id: user.id,
          receiver_id: otherUserId,
          message: messageText
        });

      if (error) {
        throw error;
      }

      toast({
        title: "메시지 전송됨",
        description: "메시지가 성공적으로 전송되었습니다.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
      // 에러 시 입력창에 다시 텍스트 복원
      setNewMessage(messageText);
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송 중 오류가 발생했습니다.",
        variant: "destructive",
      });
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


  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // "만났어요" 버튼 클릭 처리
  const handleMeetRequest = async () => {
    if (!user || !transactionId) return;

    try {
      // 새로운 핸드셰이크 생성
      const { data, error } = await supabase
        .from('rental_handshakes')
        .insert({
          transaction_id: transactionId,
          owner_confirmed: false,
          borrower_confirmed: false,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10분 후 만료
        })
        .select()
        .single();

      if (error) throw error;

      setHandshake(data);
      setIsHandshakeInitiator(true);
      setShowMeetDialog(true);

      toast({
        title: "만남 요청됨",
        description: "상대방에게 만남을 요청했습니다.",
      });

    } catch (error) {
      console.error('Error creating handshake:', error);
      toast({
        title: "만남 요청 실패",
        description: "만남 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 만남 확인 처리
  const handleMeetConfirm = async () => {
    if (!user || !handshake || !transactionId) return;

    try {
      // 현재 사용자가 owner인지 borrower인지 확인
      const { data: transaction } = await supabase
        .from('transactions')
        .select('owner_id, borrower_id')
        .eq('id', transactionId)
        .single();

      if (!transaction) throw new Error('Transaction not found');

      const isOwner = user.id === transaction.owner_id;
      const updateField = isOwner ? 'owner_confirmed' : 'borrower_confirmed';

      // 핸드셰이크 업데이트
      const { error } = await supabase
        .from('rental_handshakes')
        .update({ [updateField]: true })
        .eq('id', handshake.id);

      if (error) throw error;

      setShowMeetDialog(false);

      toast({
        title: "만남 확인됨",
        description: "만남이 확인되었습니다.",
      });

      // 핸드셰이크 정보 다시 로드
      await fetchHandshake();

    } catch (error) {
      console.error('Error confirming meet:', error);
      toast({
        title: "만남 확인 실패",
        description: "만남 확인 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 대여 시작 버튼 클릭 처리
  const handleStartRental = async () => {
    if (!user || !contract || contractLoading) return;

    setContractLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('contract-agree', {
        method: 'POST',
        body: { contractId: contract.id }
      });

      if (error) throw error;

      toast({
        title: "대여 동의 완료",
        description: "대여 시작에 동의했습니다.",
      });

      // 계약 정보 다시 로드
      await fetchContract();

    } catch (error) {
      console.error('Error agreeing to contract:', error);
      toast({
        title: "대여 동의 실패",
        description: "대여 동의 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setContractLoading(false);
    }
  };

  // 대여 계약 생성
  const createRentalContract = async () => {
    if (!user || !bookId || contractLoading) return;

    setContractLoading(true);

    try {
      const { error } = await supabase.functions.invoke('create-rental-contract', {
        method: 'POST',
        body: { 
          bookId,
          borrowerId: user.id === otherUserId ? user.id : otherUserId
        }
      });

      if (error) throw error;

      toast({
        title: "대여 계약 생성됨",
        description: "대여 계약이 생성되었습니다.",
      });

      // 계약 정보 다시 로드
      await fetchContract();

    } catch (error) {
      console.error('Error creating rental contract:', error);
      toast({
        title: "계약 생성 실패",
        description: "대여 계약 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setContractLoading(false);
    }
  };

  // 대여 시작 버튼 렌더링
  const renderRentalButton = () => {
    if (!user) return null;

    // 계약이 없는 경우 - 계약 생성 버튼
    if (!contract) {
      return (
        <div className="p-3 border-t bg-accent/10">
            <Button 
              onClick={createRentalContract}
              disabled={contractLoading}
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              {user?.id === otherUserId ? "빌렸어요" : "빌려줬어요"}
            </Button>
        </div>
      );
    }

    // 계약이 PENDING 상태인 경우
    if (contract.status === 'PENDING') {
      const isOwner = user.id === contract.owner_id;
      const isBorrower = user.id === contract.borrower_id;
      const hasAgreed = isOwner ? contract.owner_confirmed : contract.borrower_confirmed;
      const otherHasAgreed = isOwner ? contract.borrower_confirmed : contract.owner_confirmed;

      return (
        <div className="p-3 border-t bg-accent/10 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant={hasAgreed ? "default" : "secondary"}>
              내 동의: {hasAgreed ? "완료" : "대기중"}
            </Badge>
            <Badge variant={otherHasAgreed ? "default" : "secondary"}>
              상대방 동의: {otherHasAgreed ? "완료" : "대기중"}
            </Badge>
          </div>
          {!hasAgreed && (
            <Button 
              onClick={handleStartRental}
              disabled={contractLoading}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {isOwner ? "빌려주기 동의" : "빌리기 동의"}
            </Button>
          )}
          {hasAgreed && !otherHasAgreed && (
            <p className="text-sm text-muted-foreground text-center">
              상대방의 동의를 기다리고 있습니다...
            </p>
          )}
          {hasAgreed && otherHasAgreed && (
            <p className="text-sm text-green-600 text-center font-medium">
              ✅ 대여가 시작되었습니다!
            </p>
          )}
        </div>
      );
    }

    // 활성 상태인 경우
    if (contract.status === 'ACTIVE') {
      return (
        <div className="p-3 border-t bg-green-50 dark:bg-green-950">
          <p className="text-sm text-green-700 dark:text-green-300 text-center font-medium">
            ✅ 대여 진행 중
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] p-0 gap-0">
        <DialogHeader className="p-4 border-b bg-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold">{otherUserName}</DialogTitle>
              <p 
                className="text-sm text-primary hover:text-primary/80 cursor-pointer underline"
                onClick={() => {
                  navigate(`/books/${bookId}`);
                  onClose();
                }}
              >
                {bookTitle}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* 메시지 영역 */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* 대여 시작 버튼 */}
        {renderRentalButton()}

        {/* 만났어요 버튼 */}
        {contract?.status === 'ACTIVE' && (
          <div className="p-3 border-t bg-accent/10">
            <Button 
              onClick={handleMeetRequest}
              className="w-full"
              variant="warm"
              disabled={handshake && new Date() > new Date(handshake.expires_at)}
            >
              <Users className="h-4 w-4 mr-2" />
              만났어요
            </Button>
            {handshake && (
              <div className="mt-2 text-sm text-center text-muted-foreground">
                {handshake.owner_confirmed && handshake.borrower_confirmed
                  ? "✅ 양쪽 모두 만남을 확인했습니다!"
                  : "상대방의 확인을 기다리고 있습니다..."
                }
              </div>
            )}
          </div>
        )}

        {/* 메시지 입력 영역 */}
        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 만남 확인 팝업 */}
        <MeetConfirmDialog
          isOpen={showMeetDialog}
          onConfirm={handleMeetConfirm}
          otherUserName={otherUserName}
          isInitiator={isHandshakeInitiator}
        />
      </DialogContent>
    </Dialog>
  );
};