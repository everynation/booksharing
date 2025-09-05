import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UpdateBookLocationProps {
  bookId: string;
  currentAddress?: string;
  onLocationUpdated?: (latitude: number, longitude: number, address: string) => void;
}

export const UpdateBookLocation: React.FC<UpdateBookLocationProps> = ({
  bookId,
  currentAddress = '',
  onLocationUpdated
}) => {
  const [address, setAddress] = useState(currentAddress);
  const [loading, setLoading] = useState(false);

  const handleUpdateLocation = async () => {
    if (!address.trim()) {
      toast({
        title: "주소를 입력해주세요",
        description: "책의 위치를 설정하기 위해 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Edge function을 호출하여 주소를 위도/경도로 변환하고 업데이트
      const { data, error } = await supabase.functions.invoke('update-book-location', {
        body: {
          book_id: bookId,
          address: address.trim()
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || '위치 업데이트에 실패했습니다');
      }

      toast({
        title: "위치 정보 업데이트 완료",
        description: `책의 위치가 성공적으로 업데이트되었습니다.`,
      });

      // 콜백 호출
      if (onLocationUpdated) {
        onLocationUpdated(data.latitude, data.longitude, data.address);
      }

    } catch (error) {
      console.error('Error updating location:', error);
      toast({
        title: "위치 업데이트 실패",
        description: error instanceof Error ? error.message : "다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="책 위치 주소를 입력하세요 (예: 서울특별시 강남구 테헤란로 123)"
          className="w-full"
        />
      </div>
      <Button
        onClick={handleUpdateLocation}
        disabled={loading || !address.trim()}
        size="sm"
        variant="outline"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        위치 설정
      </Button>
    </div>
  );
};