import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LocationPickerState {
  selectedLocation: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  loading: boolean;
  error: string | null;
  modalOpen: boolean;
}

interface UseLocationPickerReturn extends LocationPickerState {
  openPicker: (defaultLat?: number, defaultLng?: number) => Promise<void>;
  closePicker: () => void;
  updateSelectedLocation: (lat: number, lng: number) => Promise<void>;
  confirmLocation: () => void;
  getCurrentLocation: () => Promise<void>;
  setModalOpen: (open: boolean) => void;
}

interface UseLocationPickerProps {
  onConfirm?: (lat: number, lng: number, address: string) => void;
}

export const useLocationPicker = ({ onConfirm }: UseLocationPickerProps = {}): UseLocationPickerReturn => {
  const [state, setState] = useState<LocationPickerState>({
    selectedLocation: null,
    loading: false,
    error: null,
    modalOpen: false,
  });

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

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: '이 브라우저는 위치 서비스를 지원하지 않습니다.',
        loading: false 
      }));
      return;
    }

    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isHttps) {
      setState(prev => ({ 
        ...prev, 
        error: '보안 연결(HTTPS)에서만 위치를 가져올 수 있습니다.',
        loading: false 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const address = await reverseGeocode(latitude, longitude);

          setState(prev => ({
            ...prev,
            selectedLocation: {
              lat: latitude,
              lng: longitude,
              address
            },
            loading: false,
            error: null,
          }));

          toast({
            title: "현재 위치를 찾았습니다",
            description: "핀을 움직여서 정확한 위치를 선택하세요",
          });

          resolve();
        },
        (error) => {
          let errorMessage = '위치를 가져올 수 없습니다.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 지도에서 직접 위치를 선택해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 가져올 수 없습니다. 지도에서 직접 위치를 선택해주세요.';
              break;
            case error.TIMEOUT:
              errorMessage = '요청이 시간 초과되었습니다. 지도에서 직접 위치를 선택해주세요.';
              break;
          }

          setState(prev => ({ 
            ...prev, 
            selectedLocation: {
              lat: 37.5665, // Seoul City Hall as default
              lng: 126.9780,
              address: '서울특별시 중구 세종대로 110'
            },
            loading: false,
            error: errorMessage 
          }));

          toast({
            title: errorMessage,
            description: "지도에서 직접 위치를 선택해주세요.",
            variant: "destructive",
          });

          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const openPicker = useCallback(async (defaultLat?: number, defaultLng?: number): Promise<void> => {
    setState(prev => ({ ...prev, modalOpen: true }));
    
    if (defaultLat && defaultLng) {
      const address = await reverseGeocode(defaultLat, defaultLng);
      setState(prev => ({ 
        ...prev, 
        selectedLocation: { lat: defaultLat, lng: defaultLng, address } 
      }));
    } else {
      await getCurrentLocation();
    }
  }, [getCurrentLocation]);

  const closePicker = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      modalOpen: false, 
      selectedLocation: null, 
      error: null 
    }));
  }, []);

  const updateSelectedLocation = useCallback(async (lat: number, lng: number): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    
    const address = await reverseGeocode(lat, lng);
    
    setState(prev => ({
      ...prev,
      selectedLocation: { lat, lng, address },
      loading: false,
    }));
  }, []);

  const confirmLocation = useCallback(() => {
    if (!state.selectedLocation) return;
    
    const { lat, lng, address } = state.selectedLocation;
    
    onConfirm?.(lat, lng, address || '');
    
    // Update hidden inputs
    const latInput = document.getElementById('lat-input') as HTMLInputElement;
    const lngInput = document.getElementById('lng-input') as HTMLInputElement;
    const addressInput = document.getElementById('address-input') as HTMLInputElement;
    
    if (latInput) latInput.value = lat.toString();
    if (lngInput) lngInput.value = lng.toString();
    if (addressInput) addressInput.value = address || '';
    
    closePicker();
    
    toast({
      title: "위치가 설정되었습니다",
      description: address || `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`,
    });
  }, [state.selectedLocation, onConfirm, closePicker]);

  const setModalOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, modalOpen: open }));
  }, []);

  return {
    ...state,
    openPicker,
    closePicker,
    updateSelectedLocation,
    confirmLocation,
    getCurrentLocation,
    setModalOpen,
  };
};