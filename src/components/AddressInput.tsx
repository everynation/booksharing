import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';

declare global {
  interface Window {
    kakao: any;
  }
}

interface AddressResult {
  address_name?: string;
  road_address_name?: string;
  place_name?: string;
  x: string; // longitude
  y: string; // latitude
}

interface AddressInputProps {
  value?: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  showMap?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value = '',
  onChange,
  placeholder = '주소를 입력하세요',
  showMap = false
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const { ready: kakaoReady, ensureLoaded } = useKakaoMaps();
  const { toast } = useToast();

  useEffect(() => {
    console.log("[AddressInput] Component mounted");
    // Kakao Maps API 초기화
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        console.log('Kakao Maps API loaded');
      });
    }
  }, []);

  // 기존 주소가 있을 때 좌표 정보 검색
  useEffect(() => {
    if (!value || selectedCoordinates) return;
    
    const searchCoordinatesForAddress = async () => {
      try {
        await ensureLoaded();
        
        if (!window.kakao?.maps?.services) return;
        
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(value, (results: AddressResult[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && results.length > 0) {
            const result = results[0];
            const coordinates = {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            };
            setSelectedCoordinates(coordinates);
          }
        });
      } catch (error) {
        console.error('Failed to search coordinates for address:', error);
      }
    };

    searchCoordinatesForAddress();
  }, [value, selectedCoordinates, ensureLoaded]);

  useEffect(() => {
    // 선택된 좌표가 있으면 미니 맵을 표시
    if (!showMap || !selectedCoordinates) return;

    const renderMap = async () => {
      try {
        await ensureLoaded();
        
        const container = document.getElementById('kakao-map');
        if (!container) {
          console.warn('Map container not found');
          return;
        }
        
        // 기존 지도가 있다면 제거
        container.innerHTML = '';
        
        if (!window.kakao?.maps?.LatLng || !window.kakao?.maps?.Map || !window.kakao?.maps?.Marker) {
          console.warn('Kakao Maps API not fully loaded');
          return;
        }
        
        const center = new window.kakao.maps.LatLng(
          selectedCoordinates.lat,
          selectedCoordinates.lng
        );
        const map = new window.kakao.maps.Map(container, {
          center,
          level: 3,
        });
        new window.kakao.maps.Marker({ position: center, map });
      } catch (error) {
        console.error('Failed to render map:', error);
      }
    };

    // 약간의 지연을 두어 DOM이 업데이트된 후 지도를 렌더링
    const timeoutId = setTimeout(renderMap, 200);
    return () => clearTimeout(timeoutId);
  }, [showMap, selectedCoordinates, ensureLoaded]);

  const handleSearch = async () => {
    console.log("[AddressInput] handleSearch function called!"); // 이 로그가 출력되는지 확인
    
    if (!searchQuery.trim()) {
      console.log("Search query is empty.");
      return;
    }
  
    setLoading(true);
    setSearchResults([]);
    console.log(`[AddressInput] Starting search for: "${searchQuery}"`);
  
    try {
      await ensureLoaded();
      console.log("[AddressInput] Kakao Maps SDK is loaded.");
  
      if (!window.kakao?.maps?.services) {
        toast({ title: '카카오 지도 준비 중', description: '서비스를 로드할 수 없습니다.' });
        setLoading(false);
        console.error("[AddressInput] Kakao Maps services object not found.");
        return;
      }
  
      // 먼저 키워드 검색 시도
      const places = new window.kakao.maps.services.Places();
      
      places.keywordSearch(searchQuery, (result: any[], status: any) => {
        console.log("[AddressInput] Keyword search callback executed.");
        console.log("[AddressInput] Status:", status);
        console.log("[AddressInput] Result:", result);
  
        if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
          console.log("[AddressInput] Search successful. Mapping results.");
          const mapped = result.slice(0, 10).map((p: any) => ({
            address_name: p.address_name,
            road_address_name: p.road_address_name,
            place_name: p.place_name,
            x: p.x,
            y: p.y,
          }));
          setSearchResults(mapped);
          setLoading(false);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          console.log("[AddressInput] No results found for keyword search, trying address search.");
          // 키워드 검색 결과가 없으면 주소 검색 시도
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(searchQuery, (addrResults: AddressResult[], addrStatus: any) => {
            console.log("[AddressInput] Address search callback executed.");
            console.log("[AddressInput] Address search status:", addrStatus);
            console.log("[AddressInput] Address search results:", addrResults);
            
            if (addrStatus === window.kakao.maps.services.Status.OK && addrResults && addrResults.length > 0) {
              console.log("[AddressInput] Address search successful.");
              setSearchResults(addrResults.slice(0, 10));
            } else {
              console.log("[AddressInput] No results found for address search either.");
              setSearchResults([]);
            }
            setLoading(false);
          });
        } else {
          console.error("[AddressInput] Keyword search failed with status:", status);
          // 검색 실패 시에도 주소 검색 시도
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(searchQuery, (addrResults: AddressResult[], addrStatus: any) => {
            if (addrStatus === window.kakao.maps.services.Status.OK && addrResults && addrResults.length > 0) {
              console.log("[AddressInput] Address search successful as fallback.");
              setSearchResults(addrResults.slice(0, 10));
            } else {
              console.log("[AddressInput] All search methods failed.");
              setSearchResults([]);
            }
            setLoading(false);
          });
        }
      });
    } catch (error) {
      console.error('[AddressInput] Search error:', error);
      toast({ title: '오류', description: '주소 검색 중 예외가 발생했습니다.' });
      setLoading(false);
    }
  };

  const handleSelectAddress = (result: AddressResult) => {
    const address = result.road_address_name || result.address_name || result.place_name || '';
    const coordinates = {
      lat: parseFloat(result.y),
      lng: parseFloat(result.x)
    };
    
    onChange(address, coordinates);
    setSelectedCoordinates(coordinates);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false); // 모달 닫기
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <>
      <div className="relative">
        <Input
          value={value}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsSearchOpen(true)}
          className="cursor-pointer pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* 지도 표시 (옵션) - 모달 밖에서 표시 */}
      {showMap && selectedCoordinates && (
        <div className="mt-4">
          <div id="kakao-map" className="w-full h-48 rounded-lg border"></div>
        </div>
      )}

      {/* 주소 검색 모달 */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              주소 검색
            </DialogTitle>
            <DialogDescription>
              도로명/지번 또는 장소명을 입력하고 검색을 눌러주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="도로명 주소나 지번 주소를 입력하세요"
                onKeyDown={handleKeyPress}
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  console.log("[AddressInput] Search button clicked!");
                  handleSearch();
                }} 
                disabled={!searchQuery.trim() || loading}
                size="sm"
              >
                {loading ? '검색 중...' : '검색'}
              </Button>
            </div>

            {/* 검색 결과 */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectAddress(result)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        {(result.road_address_name || result.place_name) && (
                          <p className="font-medium text-sm">{result.road_address_name || result.place_name}</p>
                        )}
                        {result.address_name && (
                          <p className="text-xs text-muted-foreground">{result.address_name}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : searchQuery && !loading ? (
                <p className="text-center text-muted-foreground py-8">
                  검색 결과가 없습니다.
                </p>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  주소를 검색해주세요.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
