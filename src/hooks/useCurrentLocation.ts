import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseCurrentLocationReturn extends LocationState {
  getCurrentLocation: () => Promise<void>;
  clearLocation: () => void;
  isHttps: boolean;
}

export const useCurrentLocation = (): UseCurrentLocationReturn => {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
    loading: false,
    error: null,
  });

  const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  const checkGeolocationSupport = (): boolean => {
    if (!navigator.geolocation) {
      const errorMessage = '이 브라우저는 위치 서비스를 지원하지 않습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: "위치 서비스 미지원",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const checkHttpsConnection = (): boolean => {
    if (!isHttps) {
      const errorMessage = '보안 연결(HTTPS)에서만 위치를 가져올 수 있습니다.';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: "보안 연결 필요",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { 
          latitude: lat, 
          longitude: lng, 
          reverseGeocode: true 
        }
      });

      if (error) {
        console.error('Reverse geocoding error:', error);
        return `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
      }

      return data.address || `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
    }
  };

  const handleGeolocationError = (error: GeolocationPositionError): void => {
    let errorMessage = '위치를 가져올 수 없습니다.';
    let guidance = '';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = '위치 권한이 거부되었습니다.';
        guidance = 'ㄴ브라우저 설정에서 이 사이트의 위치 접근을 허용해주세요.\n\n' +
                  '• iOS Safari: 설정 > Safari > 위치 서비스\n' +
                  '• Android Chrome: 주소창 좌측 자물쇠 > 권한 > 위치 허용';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '위치 정보를 가져올 수 없습니다.';
        guidance = 'GPS를 켜고 다시 시도해주세요.';
        break;
      case error.TIMEOUT:
        errorMessage = '요청이 시간 초과되었습니다.';
        guidance = '실내 Wi-Fi 또는 데이터 연결 상태를 확인 후 다시 시도해주세요.';
        break;
      default:
        errorMessage = '알 수 없는 오류가 발생했습니다.';
        guidance = '잠시 후 다시 시도해주세요.';
        console.error('Geolocation error:', error.message);
    }

    setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    
    toast({
      title: errorMessage,
      description: guidance,
      variant: "destructive",
    });
  };

  const getCurrentCoords = useCallback((options: LocationOptions = {}): Promise<{lat: number, lng: number}> => {
    const defaultOptions: LocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          reject(error);
        },
        defaultOptions
      );
    });
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    // Check prerequisites
    if (!checkHttpsConnection() || !checkGeolocationSupport()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get coordinates
      const coords = await getCurrentCoords();
      
      // Get address from coordinates
      const address = await reverseGeocode(coords.lat, coords.lng);

      setState({
        latitude: coords.lat,
        longitude: coords.lng,
        address,
        loading: false,
        error: null,
      });

      toast({
        title: "현재 위치를 불러왔습니다",
        description: address,
      });

    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        handleGeolocationError(error);
      } else {
        const errorMessage = '위치를 가져오는 중 오류가 발생했습니다.';
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
        toast({
          title: errorMessage,
          description: '잠시 후 다시 시도해주세요.',
          variant: "destructive",
        });
        console.error('Location error:', error);
      }
    }
  }, [getCurrentCoords]);

  const clearLocation = useCallback((): void => {
    setState({
      latitude: null,
      longitude: null,
      address: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    getCurrentLocation,
    clearLocation,
    isHttps,
  };
};