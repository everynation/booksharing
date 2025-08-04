import React, { useState, useEffect, useRef } from 'react';
import { Send, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  bookTitle: string;
  transactionId: string;
}

interface Message {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  bookTitle,
  transactionId
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 메시지 목록 가져오기 (임시로 빈 배열 - 실제로는 DB에서 가져와야 함)
  const fetchMessages = async () => {
    // 임시 메시지 데이터
    const sampleMessages: Message[] = [
      {
        id: '1',
        sender_id: otherUserId,
        message: `안녕하세요! "${bookTitle}" 책을 대여하고 싶습니다.`,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        sender_name: otherUserName
      },
      {
        id: '2',
        sender_id: user?.id || '',
        message: '안녕하세요! 언제 받아가실 수 있나요?',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        sender_name: '나'
      },
      {
        id: '3',
        sender_id: otherUserId,
        message: '오늘 오후에 가능할까요?',
        created_at: new Date(Date.now() - 900000).toISOString(),
        sender_name: otherUserName
      }
    ];
    setMessages(sampleMessages);
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    // 새 메시지가 추가될 때 스크롤을 맨 아래로
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      // 새 메시지를 로컬 상태에 추가
      const newMsg: Message = {
        id: Date.now().toString(),
        sender_id: user.id,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender_name: '나'
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // 실제로는 여기서 DB에 저장해야 함
      // await supabase.from('messages').insert({...});

      toast({
        title: "메시지 전송됨",
        description: "메시지가 성공적으로 전송되었습니다.",
      });

    } catch (error) {
      console.error('Error sending message:', error);
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
              <p className="text-sm text-muted-foreground">"{bookTitle}" 대여 관련</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 승인/거절 버튼 */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              거절
            </Button>
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
      </DialogContent>
    </Dialog>
  );
};