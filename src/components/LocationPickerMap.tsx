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

        setIsMapReady(true);
        setMapError(null);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError('지도 초기화에 실패했습니다.');
      }
    };

    if (window.kakao && window.kakao.maps) {
      initializeMap();
    } else {
      ensureLoaded().then(initializeMap).catch(console.error);
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
        <div className="flex flex-col items-center gap-2">
          {error ? (
            <>
              <div className="h-8 w-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <span className="text-destructive">!</span>
              </div>
              <p className="text-sm text-destructive text-center">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs text-muted-foreground underline mt-2"
              >
                페이지 새로고침
              </button>
            </>
          ) : (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">지도를 불러오는 중...</p>
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
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            {mapError ? (
              <>
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <span className="text-destructive text-sm">!</span>
                </div>
                <p className="text-sm text-destructive text-center">{mapError}</p>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">지도 초기화 중...</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};