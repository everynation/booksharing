import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, CheckCircle, Scan } from 'lucide-react';

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ISBNScanner: React.FC<ISBNScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlsRef, setControlsRef] = useState<any>(null);

  useEffect(() => {
    let codeReader: BrowserMultiFormatReader | null = null;

    const startScanner = async () => {
      if (!isOpen || !videoRef.current) return;

      try {
        setError(null);
        setIsScanning(true);

        codeReader = new BrowserMultiFormatReader();

        // 카메라 스트림 시작 (안드로이드 호환성 개선)
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            aspectRatio: { ideal: 16/9 }
          }
        };

        // 안드로이드에서 후면 카메라 접근 실패 시 일반 카메라로 fallback
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.log('후면 카메라 접근 실패, 일반 카메라로 시도:', error);
          const fallbackConstraints = {
            video: {
              width: { min: 640, ideal: 1280 },
              height: { min: 480, ideal: 720 }
            }
          };
          stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        }
        videoRef.current.srcObject = stream;

        // 연속적으로 바코드 스캔 시도
        const scanLoop = async () => {
          if (!codeReader || !videoRef.current) return;
          
          try {
            const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
            
            if (result) {
              const text = result.getText();
              console.log('Scanned code:', text);
              
              // ISBN 패턴 검증 (10자리 또는 13자리)
              const cleanText = text.replace(/[-\s]/g, '');
              const isbnPattern = /^(?:97[89])?\d{9}[\dX]$/;
              
              if (isbnPattern.test(cleanText)) {
                onScan(cleanText);
                stopScanner();
                onClose();
                return;
              }
            }
          } catch (err) {
            // NotFoundException은 정상적인 상황 (바코드가 보이지 않을 때)
            if (err && !(err instanceof NotFoundException)) {
              console.error('Scanner error:', err);
            }
          }
          
          // 100ms 후 다시 스캔 시도
          if (isScanning) {
            setTimeout(scanLoop, 100);
          }
        };

        // 스캔 루프 시작
        scanLoop();

      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('카메라에 접근할 수 없습니다. 카메라 권한을 허용해주세요.');
        setIsScanning(false);
      }
    };

    const stopScanner = () => {
      setIsScanning(false);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      codeReader = null;
    };

    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, onScan, onClose, isScanning]);

  const handleClose = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Scan className="h-5 w-5 text-primary" />
            ISBN 바코드 스캔
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
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
              
              {/* 스캔 가이드 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary border-dashed w-3/4 h-1/2 rounded-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                📚 책 뒷면의 ISBN 바코드를 스캔해주세요
              </p>
              {isScanning && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm">스캔 중...</span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground">
              <p>💡 팁: 바코드를 프레임 안에 맞추고 충분한 조명을 확보하세요</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};