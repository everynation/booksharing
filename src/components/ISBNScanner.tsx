import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Scan, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ISBNScanner: React.FC<ISBNScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 1, step: 0.1 });

  const applyAdvancedCameraFeatures = async (track: MediaStreamTrack) => {
    try {
      // 자동 초점 시도
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] });
      console.log('Continuous focus mode applied.');
    } catch (e) {
      console.warn('Continuous focus mode not supported.', e);
    }

    try {
      const capabilities = track.getCapabilities();
      if (capabilities) {
        // 손전등 기능 확인
        if (capabilities.torch) {
          setTorchAvailable(true);
        }
        // 줌 기능 확인
        if (capabilities.zoom) {
          setZoomSupported(true);
          const { min, max, step } = capabilities.zoom;
          setZoomRange({ min, max, step });
          setZoom(track.getSettings().zoom ?? 1);
        }
      }
    } catch (e) {
      console.warn('Could not get camera capabilities.', e);
    }
  };
  
  const toggleTorch = async () => {
    if (!controlsRef.current) return;
    try {
      await controlsRef.current.switchTorch();
      setTorchOn(prev => !prev);
    } catch (e) {
      console.error('Failed to toggle torch', e);
    }
  };

  const handleZoomChange = async (value: number) => {
    if (!controlsRef.current) return;
    setZoom(value);
    try {
      await controlsRef.current.setZoom(value);
    } catch (e) {
      console.error('Failed to set zoom', e);
    }
  };

  useEffect(() => {
    if (!isOpen) {
        // 컴포넌트가 닫힐 때 스캐너 정리
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        codeReaderRef.current = null;
        setIsScanning(false);
        return;
    }

    if (!videoRef.current || isScanning) return;
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]);
    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;
    setIsScanning(true);

    const startScan = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                const track = stream.getVideoTracks()[0];
                if (track) {
                    await applyAdvancedCameraFeatures(track);
                }
            }

            // decodeFromVideoDevice는 지속적인 스캔을 제공합니다.
            controlsRef.current = await codeReader.decodeFromVideoDevice(
                undefined, // Use default camera
                videoRef.current,
                (result, err, controls) => {
                    if (result) {
                        const text = result.getText();
                        const cleanText = text.replace(/[-\s]/g, '');
                        const isbnPattern = /^(?:97[89])?\d{9}[\dX]$/i;

                        if (isbnPattern.test(cleanText)) {
                            onScan(cleanText);
                            controls.stop();
                            controlsRef.current = null;
                            onClose();
                        }
                    }

                    if (err && !(err instanceof NotFoundException)) {
                        console.error('Scanner error:', err);
                        setError('스캔 중 오류가 발생했습니다.');
                    }
                }
            );

        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
            setIsScanning(false);
        }
    };

    startScan();

    return () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        setIsScanning(false);
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            ISBN 바코드 스캔
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary border-dashed w-3/4 h-1/2 rounded-lg animate-pulse" />
              </div>
            </div>
            <div className="absolute bottom-12 left-0 right-0 p-3 bg-black/40 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  {torchAvailable && (
                    <Button variant="secondary" size="sm" onClick={toggleTorch} className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>{torchOn ? '손전등 끄기' : '손전등 켜기'}</span>
                    </Button>
                  )}

                  {zoomSupported && (
                    <div className="flex items-center gap-2 ml-auto">
                      <ZoomOut className="h-4 w-4 text-muted-foreground" />
                      <div className="w-40">
                        <Slider
                          value={[zoom]}
                          min={zoomRange.min}
                          max={zoomRange.max}
                          step={zoomRange.step}
                          onValueChange={(v) => handleZoomChange(v[0])}
                        />
                      </div>
                      <ZoomIn className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">책 뒷면의 ISBN 바코드를 프레임 안에 맞춰주세요.</p>
              {isScanning && <p className="text-sm text-primary animate-pulse">스캔 중...</p>}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};