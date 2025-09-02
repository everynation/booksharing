import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  onLocationSelect?: (latitude: number, longitude: number, address: string) => void;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value = '',
  onChange,
  placeholder = '주소를 입력하세요',
  showMap = false,
  onLocationSelect,
  className
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const [kakaoError, setKakaoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  
  // Use the secure Kakao Maps hook
  const { ready: kakaoHookReady, ensureLoaded } = useKakaoMaps();

  // Update local state when hook ready state changes
  useEffect(() => {
    if (kakaoHookReady) {
      setKakaoReady(true);
      setKakaoError(null);
    }
  }, [kakaoHookReady]);

  // Kakao Maps API loading using the secure hook
  const loadKakaoMaps = useCallback(async (): Promise<void> => {
    console.log("[AddressInput] loadKakaoMaps called");
    
    if (kakaoReady) {
      console.log("[AddressInput] Kakao Maps already ready");
      return Promise.resolve();
    }

    try {
      await ensureLoaded();
      console.log("[AddressInput] Kakao Maps loaded successfully via hook");
    } catch (error) {
      console.error("[AddressInput] Failed to load Kakao Maps:", error);
      setKakaoError(error instanceof Error ? error.message : 'Failed to load maps');
      throw error;
    }
  }, [kakaoReady, ensureLoaded]);



  useEffect(() => {
    console.log("[AddressInput] Component mounted");
    console.log("[AddressInput] Kakao Maps ready:", kakaoReady);
    
    // 컴포넌트 마운트 시 Kakao Maps 로딩 시도
    loadKakaoMaps().catch((error) => {
      console.error("[AddressInput] Failed to load Kakao Maps on mount:", error);
      setKakaoError(error instanceof Error ? error.message : 'Unknown error');
    });
  }, [loadKakaoMaps]);

  // 기존 주소가 있을 때 좌표 정보 검색
  useEffect(() => {
    if (!value || selectedCoordinates) return;
    
    const searchCoordinatesForAddress = async () => {
      try {
        await loadKakaoMaps();
        
        if (!window.kakao?.maps?.services) {
          console.log("[AddressInput] Kakao Maps services not available for coordinate search");
          return;
        }
        
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(value, (results: AddressResult[], status: any) => {
          if (status === window.kakao.maps.services.Status.OK && results.length > 0) {
            const result = results[0];
            const coordinates = {
              lat: parseFloat(result.y),
              lng: parseFloat(result.x)
            };
            setSelectedCoordinates(coordinates);
            console.log("[AddressInput] Coordinates found for existing address:", coordinates);
          }
        });
      } catch (error) {
        console.error('Failed to search coordinates for address:', error);
      }
    };

    searchCoordinatesForAddress();
  }, [value, selectedCoordinates, loadKakaoMaps]);

  useEffect(() => {
    // 선택된 좌표가 있으면 미니 맵을 표시
    if (!showMap || !selectedCoordinates) return;

    const renderMap = async () => {
      try {
        await loadKakaoMaps();
        
        const container = document.getElementById('kakao-map');
        if (!container) {
          console.warn('Map container not found');
          return;
        }
        
        // 기존 지도가 있다면 제거
        container.innerHTML = '';
        
        const options = {
          center: new window.kakao.maps.LatLng(selectedCoordinates.lat, selectedCoordinates.lng),
          level: 3
        };
        
        const map = new window.kakao.maps.Map(container, options);
        
        // 마커 추가
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(selectedCoordinates.lat, selectedCoordinates.lng)
        });
        marker.setMap(map);
        
      } catch (error) {
        console.error('Failed to render map:', error);
      }
    };

    renderMap();
  }, [selectedCoordinates, showMap, loadKakaoMaps]);

  const handleSearch = async () => {
    console.log("[AddressInput] handleSearch function called!");
    console.log("[AddressInput] Search query:", searchQuery);
    console.log("[AddressInput] Kakao Maps ready state:", kakaoReady);
    
    if (!searchQuery.trim()) {
      console.log("Search query is empty.");
      return;
    }
  
    setLoading(true);
    setSearchResults([]);
    console.log(`[AddressInput] Starting search for: "${searchQuery}"`);
  
    try {
      // Kakao Maps API가 완전히 로드될 때까지 대기
      console.log("[AddressInput] Ensuring Kakao Maps is loaded...");
      await loadKakaoMaps();
      console.log("[AddressInput] Kakao Maps SDK is loaded.");
  
      // 추가 대기 시간 (API가 완전히 초기화될 때까지)
      console.log("[AddressInput] Waiting for API to fully initialize...");
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      if (!window.kakao?.maps?.services) {
        console.error("[AddressInput] Kakao Maps services object not found.");
        console.error("[AddressInput] window.kakao:", window.kakao);
        console.error("[AddressInput] window.kakao?.maps:", window.kakao?.maps);
        console.error("[AddressInput] window.kakao?.maps?.services:", window.kakao?.maps?.services);
        
        const errorMsg = '카카오 지도 서비스를 로드할 수 없습니다. 잠시 후 다시 시도해주세요.';
        toast({ title: '카카오 지도 준비 중', description: errorMsg });
        setKakaoError(errorMsg);
        setLoading(false);
        return;
      }
  
      console.log("[AddressInput] Kakao Maps services available, starting search...");
      
      // 검색 방법 1: 키워드 검색
      const searchWithKeyword = () => {
        return new Promise<AddressResult[]>((resolve) => {
          try {
            console.log("[AddressInput] Creating Places service...");
            const places = new window.kakao.maps.services.Places();
            console.log("[AddressInput] Places service created successfully");
            
            console.log("[AddressInput] Starting keyword search with query:", searchQuery);
            places.keywordSearch(searchQuery, (result: any[], status: any) => {
              console.log("[AddressInput] Keyword search callback executed.");
              console.log("[AddressInput] Status:", status);
              console.log("[AddressInput] Result:", result);
      
              if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
                console.log("[AddressInput] Keyword search successful. Mapping results.");
                const mapped = result.slice(0, 10).map((p: any) => ({
                  address_name: p.address_name,
                  road_address_name: p.road_address_name,
                  place_name: p.place_name,
                  x: p.x,
                  y: p.y,
                }));
                resolve(mapped);
              } else {
                console.log("[AddressInput] Keyword search failed or no results.");
                resolve([]);
              }
            });
          } catch (error) {
            console.error("[AddressInput] Error in keyword search:", error);
            resolve([]);
          }
        });
      };

      // 검색 방법 2: 주소 검색
      const searchWithAddress = () => {
        return new Promise<AddressResult[]>((resolve) => {
          try {
            console.log("[AddressInput] Creating Geocoder service...");
            const geocoder = new window.kakao.maps.services.Geocoder();
            console.log("[AddressInput] Geocoder service created successfully");
            
            console.log("[AddressInput] Starting address search with query:", searchQuery);
            geocoder.addressSearch(searchQuery, (addrResults: AddressResult[], addrStatus: any) => {
              console.log("[AddressInput] Address search callback executed.");
              console.log("[AddressInput] Address search status:", addrStatus);
              console.log("[AddressInput] Address search results:", addrResults);
              
              if (addrStatus === window.kakao.maps.services.Status.OK && addrResults && addrResults.length > 0) {
                console.log("[AddressInput] Address search successful.");
                resolve(addrResults.slice(0, 10));
              } else {
                console.log("[AddressInput] Address search failed or no results.");
                resolve([]);
              }
            });
          } catch (error) {
            console.error("[AddressInput] Error in address search:", error);
            resolve([]);
          }
        });
      };

      // 먼저 키워드 검색 시도
      console.log("[AddressInput] Starting keyword search...");
      let results = await searchWithKeyword();
      
      // 키워드 검색 결과가 없으면 주소 검색 시도
      if (results.length === 0) {
        console.log("[AddressInput] No keyword results, trying address search...");
        results = await searchWithAddress();
      }

      console.log("[AddressInput] Final search results:", results);
      setSearchResults(results);
      setLoading(false);

    } catch (error) {
      console.error('[AddressInput] Search error:', error);
      const errorMsg = error instanceof Error ? error.message : '주소 검색 중 예외가 발생했습니다.';
      toast({ title: '오류', description: errorMsg });
      setKakaoError(errorMsg);
      setLoading(false);
    }
  };

  const handleSelectAddress = (result: AddressResult) => {
    console.log("[AddressInput] Address selected:", result);
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
    
    // Call onLocationSelect if provided (for simplified usage)
    if (onLocationSelect) {
      onLocationSelect(coordinates.lat, coordinates.lng, address);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const retryKakaoMaps = async () => {
    setKakaoError(null);
    setRetryCount(prev => prev + 1);
    try {
      await loadKakaoMaps();
    } catch (error) {
      console.error('[AddressInput] Retry failed:', error);
      setKakaoError('카카오 지도를 다시 로드할 수 없습니다.');
    }
  };

  // Kakao Maps 에러 상태 표시
  if (kakaoError && !kakaoReady) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            카카오 지도를 로드할 수 없습니다. 
            <Button 
              variant="link" 
              className="p-0 h-auto font-normal text-destructive underline"
              onClick={retryKakaoMaps}
            >
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
        <div className="relative">
          <Input
            value={value}
            placeholder={placeholder}
            readOnly
            disabled
            className="cursor-not-allowed pr-10 opacity-50"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            disabled
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className || ''}`}>
        <Input
          value={value}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsSearchOpen(true)}
          className="cursor-pointer pr-10 hover:bg-accent/50 transition-colors"
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
              <br />
              <span className="text-xs text-muted-foreground">
                💡 Enter 키로 검색할 수 있습니다
              </span>
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
                onClick={handleSearch} 
                disabled={!searchQuery.trim() || loading}
                size="sm"
                className="min-w-[80px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    검색 중
                  </div>
                ) : (
                  '검색'
                )}
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
                          <p className="font-medium text-sm text-foreground">
                            {result.road_address_name || result.place_name}
                          </p>
                        )}
                        {result.address_name && (
                          <p className="text-xs text-muted-foreground">
                            {result.address_name}
                          </p>
                        )}
                        {result.place_name && result.road_address_name && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            📍 {result.place_name}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : searchQuery && !loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">검색 결과가 없습니다.</p>
                  <p className="text-xs text-muted-foreground">
                    다른 키워드로 검색해보세요.<br />
                    예: "강남대로", "서울시 강남구" 등
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">주소를 검색해주세요.</p>
                  <p className="text-xs text-muted-foreground">
                    도로명 주소, 지번 주소, 건물명 등을<br />
                    입력하고 검색 버튼을 클릭하세요.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
