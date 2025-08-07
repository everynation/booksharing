import React, { useState, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

declare global {
  interface Window {
    kakao: any;
  }
}

interface AddressResult {
  address_name: string;
  road_address_name?: string;
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

  useEffect(() => {
    // Kakao Maps API 초기화
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        console.log('Kakao Maps API loaded');
      });
    }
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim() || !window.kakao) return;

    setLoading(true);
    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      geocoder.addressSearch(query, (results: AddressResult[], status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          setSearchResults(results.slice(0, 10)); // 최대 10개 결과
        } else {
          setSearchResults([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Address search error:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchAddresses(searchQuery);
  };

  const handleSelectAddress = (result: AddressResult) => {
    const address = result.road_address_name || result.address_name;
    const coordinates = {
      lat: parseFloat(result.y),
      lng: parseFloat(result.x)
    };
    
    onChange(address, coordinates);
    setSelectedCoordinates(coordinates);
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
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

      {/* 주소 검색 모달 */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              주소 검색
            </DialogTitle>
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
                        {result.road_address_name && (
                          <p className="font-medium text-sm">{result.road_address_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{result.address_name}</p>
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

            {/* 지도 표시 (옵션) */}
            {showMap && selectedCoordinates && (
              <div className="mt-4">
                <div id="kakao-map" className="w-full h-48 rounded-lg border"></div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};