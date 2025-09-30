import React, { useEffect, useRef, useState } from 'react';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  lat,
  lng,
  onLocationChange,
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const { ready, ensureLoaded, error } = useKakaoMaps();
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!ready || !mapContainer.current) return;

    const initializeMap = () => {
      try {
        console.log("[LocationPickerMap] Initializing map with coordinates:", lat, lng);
        
        const options = {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 3
        };

        map.current = new window.kakao.maps.Map(mapContainer.current, options);
        
        // Add map controls
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        const zoomControl = new window.kakao.maps.ZoomControl();
        map.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // Create draggable marker
        const markerPosition = new window.kakao.maps.LatLng(lat, lng);
        marker.current = new window.kakao.maps.Marker({
          position: markerPosition,
          draggable: true
        });

        marker.current.setMap(map.current);

        // Add marker drag event
        window.kakao.maps.event.addListener(marker.current, 'dragend', () => {
          const position = marker.current.getPosition();
          const newLat = position.getLat();
          const newLng = position.getLng();
          
          // Update map center to follow marker
          map.current.setCenter(new window.kakao.maps.LatLng(newLat, newLng));
          
          onLocationChange(newLat, newLng);
        });

        // Add map click event to move marker
        window.kakao.maps.event.addListener(map.current, 'click', (mouseEvent: any) => {
          const clickPosition = mouseEvent.latLng;
          const newLat = clickPosition.getLat();
          const newLng = clickPosition.getLng();
          
          // Move marker to clicked position
          marker.current.setPosition(clickPosition);
          
          onLocationChange(newLat, newLng);
        });

        console.log("[LocationPickerMap] Map initialized successfully");
        setIsMapReady(true);
        setMapError(null);
      } catch (error) {
        console.error('[LocationPickerMap] Failed to initialize map:', error);
        setMapError('지도 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
        setIsMapReady(false);
      }
    };

    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      initializeMap();
    } else {
      console.log('[LocationPickerMap] Kakao maps not ready, ensuring loaded...');
      ensureLoaded()
        .then(() => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
            console.log('[LocationPickerMap] Kakao maps loaded, initializing map...');
            initializeMap();
          } else {
            console.error('Kakao Maps not properly loaded after ensureLoaded');
            setMapError('지도 로딩에 실패했습니다.');
          }
        })
        .catch((error) => {
          console.error('[LocationPickerMap] Failed to load Kakao maps:', error);
          setMapError('지도 API 연결에 실패했습니다.');
        });
    }
  }, [ready, lat, lng, onLocationChange, ensureLoaded]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (!marker.current || !map.current) return;

    const newPosition = new window.kakao.maps.LatLng(lat, lng);
    marker.current.setPosition(newPosition);
    map.current.setCenter(newPosition);
  }, [lat, lng]);

  if (!ready || error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={{ height: '400px' }}>
        <div className="flex flex-col items-center gap-3 p-4">
          {error ? (
            <>
              <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-destructive text-xl">!</span>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-destructive">지도 로딩 실패</p>
                <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setMapError(null);
                    ensureLoaded().catch(console.error);
                  }} 
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  다시 시도
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80"
                >
                  새로고침
                </button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
                <p className="text-xs text-muted-foreground">잠시만 기다려주세요</p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden"
        style={{ height: '400px' }}
      />
      {(!isMapReady || mapError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3 p-4 bg-background/90 rounded-lg shadow-lg">
            {mapError ? (
              <>
                <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                  <span className="text-destructive text-lg">!</span>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-destructive">지도 초기화 실패</p>
                  <p className="text-xs text-muted-foreground max-w-xs">{mapError}</p>
                </div>
                <button 
                  onClick={() => {
                    setMapError(null);
                    setIsMapReady(false);
                    // Re-trigger map initialization
                    if (window.kakao && window.kakao.maps) {
                      const initializeMap = () => {
                        try {
                          const options = {
                            center: new window.kakao.maps.LatLng(lat, lng),
                            level: 3
                          };
                          map.current = new window.kakao.maps.Map(mapContainer.current, options);
                          setIsMapReady(true);
                          setMapError(null);
                        } catch (error) {
                          console.error('Failed to reinitialize map:', error);
                          setMapError('지도 초기화에 실패했습니다.');
                        }
                      };
                      initializeMap();
                    }
                  }} 
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  다시 시도
                </button>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">지도 초기화 중...</p>
                  <p className="text-xs text-muted-foreground">잠시만 기다려주세요</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
