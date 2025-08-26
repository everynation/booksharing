import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Scan } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader, Result } from '@zxing/browser';

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ISBNScanner: React.FC<ISBNScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // 카메라 초기화
  const initializeCamera = useCallback(async () => {
    if (!isOpen) return;

    try {
      setError(null);
      setIsProcessing(true);

      // 기존 스트림 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // 새 카메라 스트림 가져오기
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setIsScanning(true);
        
        // ZXing 스캐너 시작
        startZXingScanner();
      }

    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else {
        setError('카메라 초기화 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isOpen, cameraFacing, stream]);

  // ZXing 스캐너 시작
  const startZXingScanner = useCallback(() => {
    if (!videoRef.current || !stream) return;

    try {
      // 기존 리더 정리
      if (readerRef.current) {
        readerRef.current.reset();
      }

      // 새 ZXing 리더 생성
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      console.log('Starting ZXing scanner...');
      
      // 연속 바코드 디코딩 시작
      reader.decodeFromVideoDevice(
        undefined, // 기본 비디오 입력 장치 사용
        videoRef.current,
        (result: Result | null, error: any) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Barcode detected:', scannedText);
            
            // ISBN 형식 검증
            const isbn = validateISBN(scannedText);
            if (isbn) {
              console.log('Valid ISBN detected:', isbn);
              setIsProcessing(true);
              
              // 스캔 성공 처리
              onScan(isbn);
              onClose();
              return;
            } else {
              console.log('Invalid ISBN format:', scannedText);
              setScanAttempts(prev => prev + 1);
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.warn('ZXing decode error:', error);
            setScanAttempts(prev => prev + 1);
          }
        }
      );

    } catch (err) {
      console.error('ZXing scanner initialization failed:', err);
      setError('바코드 스캐너 초기화에 실패했습니다.');
    }
  }, [stream, onScan, onClose]);

  // ISBN 형식 검증
  const validateISBN = (text: string): string | null => {
    // 공백과 하이픈 제거
    const cleanText = text.replace(/[-\s]/g, '');
    
    // ISBN-10 또는 ISBN-13 형식 검증
    const isbn10Pattern = /^\d{9}[\dX]$/i;
    const isbn13Pattern = /^97[89]\d{10}$/;
    
    if (isbn10Pattern.test(cleanText) || isbn13Pattern.test(cleanText)) {
      return cleanText;
    }
    
    return null;
  };

  // 카메라 전환
  const switchCamera = useCallback(() => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  // 수동 스캔 (테스트용)
  const handleManualScan = useCallback(() => {
    if (isProcessing) return;
    
    // 테스트용 랜덤 ISBN 생성
    const mockISBN = generateMockISBN();
    onScan(mockISBN);
    onClose();
  }, [isProcessing, onScan, onClose]);

  // 테스트용 랜덤 ISBN 생성
  const generateMockISBN = () => {
    // ISBN-13 형식: 978-XXXXXXXXX-X
    const prefix = '978';
    const middle = Math.random().toString().slice(2, 11);
    const checkDigit = Math.floor(Math.random() * 10);
    return `${prefix}${middle}${checkDigit}`;
  };

  // 컴포넌트 마운트/언마운트 시 카메라 정리
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (readerRef.current) {
        readerRef.current.reset();
      }
      setIsScanning(false);
      setError(null);
      setScanAttempts(0);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, [isOpen, initializeCamera, stream]);

  // 카메라 방향 변경 시 재초기화
  useEffect(() => {
    if (isOpen && stream) {
      initializeCamera();
    }
  }, [cameraFacing, initializeCamera, isOpen, stream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <Card className="w-full max-w-md mx-4 p-6 bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ISBN 스캔</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative mb-4">
          <video
            ref={videoRef}
            className="w-full h-64 bg-gray-900 rounded-lg"
            autoPlay
            playsInline
            muted
          />
          
          {/* 스캔 가이드 오버레이 */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-primary rounded-lg p-2">
                <Scan className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={switchCamera}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            카메라 전환
          </Button>
          
          <Button
            onClick={handleManualScan}
            className="flex-1"
            disabled={isProcessing}
          >
            <Scan className="h-4 w-4 mr-2" />
            테스트 스캔
          </Button>
        </div>

        <div className="text-sm text-muted-foreground text-center space-y-2">
          <p>바코드를 카메라에 비춰주세요</p>
          {isScanning && (
            <p className="text-primary">스캔 시도: {scanAttempts}회</p>
          )}
        </div>
      </Card>
    </div>
  );
};