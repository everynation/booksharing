import React from 'react';
import { Navigation, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';

interface CurrentLocationButtonProps {
  onLocationSelect?: (latitude: number, longitude: number, address: string) => void;
  onAddressChange?: (address: string) => void;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showErrorAlert?: boolean;
  disabled?: boolean;
}

export const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onLocationSelect,
  onAddressChange,
  className,
  size = "default",
  variant = "outline",
  showErrorAlert = true,
  disabled = false,
}) => {
  const {
    latitude,
    longitude,
    address,
    loading,
    error,
    getCurrentLocation,
    isHttps,
  } = useCurrentLocation();

  // Handle location updates
  React.useEffect(() => {
    if (latitude && longitude && address) {
      onLocationSelect?.(latitude, longitude, address);
      onAddressChange?.(address);
    }
  }, [latitude, longitude, address, onLocationSelect, onAddressChange]);

  const handleClick = () => {
    if (disabled) return;
    getCurrentLocation();
  };

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          현재 위치 확인 중...
        </>
      );
    }

    if (!isHttps) {
      return (
        <>
          <AlertTriangle className="h-4 w-4" />
          HTTPS 필요
        </>
      );
    }

    return (
      <>
        <Navigation className="h-4 w-4" />
        현재 위치 사용
      </>
    );
  };

  const getGuidanceButton = () => {
    if (error && error.includes('권한이 거부')) {
      return (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => {
            // iOS와 Android에 따른 설정 가이드
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const guidance = isIOS
              ? '설정 > Safari > 개인정보 보호 및 보안 > 위치 서비스'
              : '브라우저 주소창 좌측의 자물쇠 아이콘을 클릭하여 위치 권한을 허용해주세요.';
            
            alert(`위치 권한 설정 방법:\n\n${guidance}`);
          }}
        >
          <Settings className="h-3 w-3 mr-1" />
          설정 방법 보기
        </Button>
      );
    }

    if (error) {
      return (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={handleClick}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          다시 시도
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <Button
        id="use-current-location"
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={disabled || loading || !isHttps}
        aria-busy={loading}
        role="button"
      >
        {getButtonContent()}
      </Button>

      {/* Error Alert */}
      {showErrorAlert && error && (
        <Alert variant="destructive" className="text-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <div>{error}</div>
            {getGuidanceButton()}
          </AlertDescription>
        </Alert>
      )}

      {/* HTTPS Warning */}
      {showErrorAlert && !isHttps && (
        <Alert variant="destructive" className="text-sm">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            보안 연결(HTTPS)에서만 위치를 가져올 수 있습니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};