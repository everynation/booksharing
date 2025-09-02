import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LocationPickerButton } from "@/components/LocationPickerButton";

interface SimpleAddressInputProps {
  onLocationSelect: (latitude: number, longitude: number, address: string) => void;
  placeholder?: string;
  className?: string;
  showLocationPicker?: boolean;
  defaultLat?: number;
  defaultLng?: number;
}

export const SimpleAddressInput = ({ onLocationSelect, placeholder = "주소를 입력하세요", className, showLocationPicker = true, defaultLat, defaultLng }: SimpleAddressInputProps) => {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{address: string, latitude: number, longitude: number}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address: query.trim() }
      });

      if (error) {
        throw error;
      }

      if (data.results && data.results.length > 0) {
        setSuggestions(data.results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAddresses(address);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [address]);

  const handleSuggestionClick = (suggestion: {address: string, latitude: number, longitude: number}) => {
    onLocationSelect(suggestion.latitude, suggestion.longitude, suggestion.address);
    setAddress(suggestion.address);
    setShowSuggestions(false);
    
    // Update hidden inputs
    const latInput = document.getElementById('lat-input') as HTMLInputElement;
    const lngInput = document.getElementById('lng-input') as HTMLInputElement;
    if (latInput) latInput.value = suggestion.latitude.toString();
    if (lngInput) lngInput.value = suggestion.longitude.toString();
    
    toast({
      title: "위치 선택 완료",
      description: `${suggestion.address}가 선택되었습니다.`,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleInputBlur = () => {
    // 약간의 지연을 두어 suggestion 클릭이 가능하도록 함
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="address-input"
            value={address}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => address && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className="pl-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">{suggestion.address}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Location Picker Button */}
      {showLocationPicker && (
        <LocationPickerButton
          onLocationSelect={(lat, lng, addr) => {
            onLocationSelect(lat, lng, addr);
            setAddress(addr);
          }}
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          size="sm"
          variant="outline"
          className="w-full"
        >
          현재 위치 사용
        </LocationPickerButton>
      )}

      {/* Hidden inputs for latitude and longitude */}
      <input type="hidden" id="lat-input" />
      <input type="hidden" id="lng-input" />
    </div>
  );
};