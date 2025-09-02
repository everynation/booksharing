import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocationPickerMap } from './LocationPickerMap';
import { MapPin, Navigation, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLocation: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  onLocationChange: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onGetCurrentLocation: () => void;
  loading: boolean;
  error: string | null;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  open,
  onOpenChange,
  selectedLocation,
  onLocationChange,
  onConfirm,
  onGetCurrentLocation,
  loading,
  error
}) => {
  if (!selectedLocation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            위치 선택
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Instructions */}
          <div className="px-6 py-3 bg-muted/50 border-b">
            <p className="text-sm text-muted-foreground">
              📍 핀을 드래그하거나 지도를 클릭해서 정확한 위치를 선택하세요
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="px-6 py-3">
              <Alert>
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Map Container */}
          <div className="flex-1 px-6 py-4">
            <LocationPickerMap
              lat={selectedLocation.lat}
              lng={selectedLocation.lng}
              onLocationChange={onLocationChange}
              className="h-full"
            />
          </div>

          {/* Selected Location Info */}
          <div className="px-6 py-3 border-t bg-background">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">선택된 위치</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {selectedLocation.address || `위도: ${selectedLocation.lat.toFixed(6)}, 경도: ${selectedLocation.lng.toFixed(6)}`}
              </p>
              <p className="text-xs text-muted-foreground pl-6">
                위도: {selectedLocation.lat.toFixed(6)}, 경도: {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t bg-background space-y-3">
            {/* Current Location Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onGetCurrentLocation}
              disabled={loading}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              현재 위치로 이동
            </Button>

            {/* Main Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1"
              >
                <MapPin className="h-4 w-4 mr-2" />
                이 위치로 설정
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};