import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPickerModal } from './LocationPickerModal';
import { useLocationPicker } from '@/hooks/useLocationPicker';

interface LocationPickerButtonProps {
  onLocationSelect?: (latitude: number, longitude: number, address: string) => void;
  defaultLat?: number;
  defaultLng?: number;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  children?: React.ReactNode;
}

export const LocationPickerButton: React.FC<LocationPickerButtonProps> = ({
  onLocationSelect,
  defaultLat,
  defaultLng,
  className,
  size = "default",
  variant = "outline",
  disabled = false,
  children
}) => {
  const {
    selectedLocation,
    loading,
    error,
    modalOpen,
    openPicker,
    closePicker,
    updateSelectedLocation,
    confirmLocation,
    getCurrentLocation,
    setModalOpen
  } = useLocationPicker({
    onConfirm: onLocationSelect
  });

  const handleOpenPicker = () => {
    openPicker(defaultLat, defaultLng);
  };

  return (
    <>
      <Button
        id="use-current-location"
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleOpenPicker}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        <MapPin className="h-4 w-4 mr-2" />
        {children || "위치 선택"}
      </Button>

      <LocationPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedLocation={selectedLocation}
        onLocationChange={updateSelectedLocation}
        onConfirm={confirmLocation}
        onGetCurrentLocation={getCurrentLocation}
        loading={loading}
        error={error}
      />
    </>
  );
};