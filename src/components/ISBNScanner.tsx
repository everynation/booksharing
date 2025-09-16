import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ISBNScanner: React.FC<ISBNScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isSupported, setIsSupported] = useState(true);
  const [isSecure, setIsSecure] = useState(true);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const checkEnvironment = () => {
    // Check if running in secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';
    setIsSecure(isSecureContext);

    // Check if MediaDevices API is supported
    const isMediaSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
    setIsSupported(isMediaSupported);

    return isSecureContext && isMediaSupported;
  };

  const initializeCamera = async () => {
    if (!checkEnvironment()) return;

    try {
      setError('');
      setIsScanning(true);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        await startZXingScanner();
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      setIsScanning(false);
    }
  };

  const startZXingScanner = async () => {
    if (!videoRef.current) return;

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      const result = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Scanned text:', scannedText);
            
            if (validateISBN(scannedText)) {
              onScan(scannedText);
              cleanupCamera();
            }
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Scanning error:', error);
          }
        }
      );
    } catch (err) {
      console.error('ZXing scanner error:', err);
      setError('스캐너 초기화에 실패했습니다.');
    }
  };

  const validateISBN = (text: string): boolean => {
    // Clean the text and check if it's a valid ISBN
    const cleaned = text.replace(/[^0-9X]/g, '');
    
    // Check for ISBN-10 (10 digits) or ISBN-13 (13 digits)
    if (cleaned.length === 10 || cleaned.length === 13) {
      console.log('Valid ISBN detected:', cleaned);
      return true;
    }
    
    // Also check for partial matches that might be ISBN
    if (cleaned.length >= 9 && cleaned.length <= 14) {
      console.log('Potential ISBN detected:', cleaned);
      return true;
    }
    
    return false;
  };

  const cleanupCamera = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    setIsScanning(false);
    onClose();
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (isOpen && isSupported && isSecure) {
      initializeCamera();
    }
    
    return () => {
      cleanupCamera();
    };
  }, [isOpen, facingMode]);

  useEffect(() => {
    if (facingMode && isOpen && isSupported && isSecure) {
      initializeCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            ISBN 바코드 스캔
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isSecure && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                보안 연결(HTTPS)이 필요합니다. 카메라 기능을 사용할 수 없습니다.
              </AlertDescription>
            </Alert>
          )}

          {!isSupported && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                이 브라우저는 카메라 기능을 지원하지 않습니다.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSupported && isSecure && (
            <>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                  muted
                />
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary bg-primary/10 rounded-lg p-8">
                      <div className="w-32 h-32 border-2 border-primary rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={switchCamera}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={!isScanning}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  카메라 전환
                </Button>
                
                <Button
                  onClick={initializeCamera}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={isScanning}
                >
                  다시 스캔
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                책의 ISBN 바코드를 카메라로 스캔해주세요
              </div>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={() => onScan('9788932917245')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  테스트용 ISBN 입력
                </Button>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={cleanupCamera} variant="outline">
            <X className="h-4 w-4 mr-2" />
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};