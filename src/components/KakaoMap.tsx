import React, { useEffect, useRef } from 'react';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapMarker {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  transaction_type: string;
}

interface KakaoMapProps {
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  center?: { lat: number; lng: number };
  style?: React.CSSProperties;
  className?: string;
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  markers,
  onMarkerClick,
  center,
  style = { width: '100%', height: '400px' },
  className = ''
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const mapMarkers = useRef<any[]>([]);
  const { ready, ensureLoaded, error } = useKakaoMaps();

  useEffect(() => {
    if (!ready || !mapContainer.current) return;

    // 지도 초기화
    const initializeMap = () => {
      try {
        const mapCenter = center || { lat: 37.5665, lng: 126.9780 }; // 서울시청 기본 위치
        
        const options = {
          center: new window.kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
          level: 3
        };

        map.current = new window.kakao.maps.Map(mapContainer.current, options);

        // 지도 타입 컨트롤 추가
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        // 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      initializeMap();
    } else {
      ensureLoaded()
        .then(() => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
            initializeMap();
          }
        })
        .catch(console.error);
    }
  }, [ready, center, ensureLoaded]);

  useEffect(() => {
    if (!map.current || !markers.length) return;

    // 기존 마커 제거
    mapMarkers.current.forEach(marker => marker.setMap(null));
    mapMarkers.current = [];

    // 새 마커 추가
    const bounds = new window.kakao.maps.LatLngBounds();

    markers.forEach(markerData => {
      const position = new window.kakao.maps.LatLng(markerData.lat, markerData.lng);
      
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: position,
        title: markerData.title
      });

      marker.setMap(map.current);
      mapMarkers.current.push(marker);

      // 마커 클릭 이벤트
      if (onMarkerClick) {
        window.kakao.maps.event.addListener(marker, 'click', () => {
          onMarkerClick(markerData);
        });
      }

      // 인포윈도우 생성
      const infoContent = `
        <div style="padding: 5px; min-width: 150px;">
          <div style="font-weight: bold; margin-bottom: 5px;">${markerData.title}</div>
          <div style="font-size: 12px; color: #666; margin-bottom: 3px;">${markerData.address}</div>
          <div style="font-size: 12px;">
            <span style="color: #007bff;">${markerData.transaction_type === 'sale' ? '판매' : '대여'}</span>
            <span style="margin-left: 5px; font-weight: bold;">${markerData.price.toLocaleString()}원</span>
          </div>
        </div>
      `;

      const infoWindow = new window.kakao.maps.InfoWindow({
        content: infoContent
      });

      // 마커에 마우스오버 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infoWindow.open(map.current, marker);
      });

      // 마커에 마우스아웃 이벤트
      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      bounds.extend(position);
    });

    // 모든 마커가 보이도록 지도 범위 조정
    if (markers.length > 1) {
      map.current.setBounds(bounds);
    } else if (markers.length === 1) {
      map.current.setCenter(new window.kakao.maps.LatLng(markers[0].lat, markers[0].lng));
    }
  }, [markers, onMarkerClick]);

  if (error) {
    return (
      <div 
        style={style} 
        className={`rounded-lg overflow-hidden bg-muted flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <p>지도를 불러올 수 없습니다</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div 
        style={style} 
        className={`rounded-lg overflow-hidden bg-muted flex items-center justify-center ${className}`}
      >
        <div className="text-center text-muted-foreground">
          <p>지도를 로딩하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      style={style} 
      className={`rounded-lg overflow-hidden ${className}`}
    />
  );
};