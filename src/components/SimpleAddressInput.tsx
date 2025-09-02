import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SimpleAddressInputProps {
  onLocationSelect: (latitude: number, longitude: number, address: string) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleAddressInput = ({ onLocationSelect, placeholder = "주소를 입력하세요", className }: SimpleAddressInputProps) => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGeocode = async () => {
    if (!address.trim()) {
      toast({
        title: "주소를 입력해주세요",
        description: "검색할 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: address.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.latitude && data.longitude) {
        onLocationSelect(data.latitude, data.longitude, data.address);
        setAddress(""); // Clear input after successful search
        toast({
          title: "위치 검색 완료",
          description: `${data.address}의 위치를 찾았습니다.`,
        });
      } else {
        toast({
          title: "위치를 찾을 수 없습니다",
          description: "입력한 주소의 위치를 찾을 수 없습니다. 다른 주소를 시도해보세요.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "위치 검색 실패",
        description: "주소 검색 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGeocode();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      <Button 
        onClick={handleGeocode} 
        disabled={loading || !address.trim()}
        size="default"
      >
        <Search className="h-4 w-4" />
        {loading ? "검색중..." : "검색"}
      </Button>
    </div>
  );
};