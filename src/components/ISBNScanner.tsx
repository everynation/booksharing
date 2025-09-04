import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Scan, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { toast } from 'sonner';

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
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const [isHttpsSecure, setIsHttpsSecure] = useState(true);
  const [hasMediaSupport, setHasMediaSupport] = useState(true);
  
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 브라우저 지원 및 보안 환경 체크
  const checkEnvironment = useCallback(() => {
    // HTTPS 환경 체크
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttpsSecure(isSecure);

    // MediaDevices API 지원 체크
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setHasMediaSupport(hasMedia);

    return isSecure && hasMedia;
  }, []);

  // 카메라 초기화
  const initializeCamera = useCallback(async () => {
    if (!isOpen) return;

    // 환경 체크 먼저 수행
    if (!checkEnvironment()) {
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      setScanStartTime(Date.now());

      // 기존 스트림 정리
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // 고해상도 후면카메라 설정
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        }
      };

      // 새 카메라 스트림 가져오기
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setIsScanning(true);
        
        // ZXing 스캐너 시작
        startZXingScanner();
        
        // 5초 타이머 시작
        startScanTimeout();
      }

    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        toast.error('카메라 권한을 허용하고 다시 시도해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotSupportedError') {
        setError('이 브라우저에서는 카메라 기능을 지원하지 않습니다.');
      } else {
        setError('카메라 초기화 중 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isOpen, cameraFacing, stream, checkEnvironment]);

  // 스캔 타임아웃 처리
  const startScanTimeout = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      if (isScanning) {
        toast.error('인식 실패 - 빛을 더 밝게 하거나 카메라를 책에 가까이 대보세요', {
          description: '다시 시도하려면 스캔 버튼을 눌러주세요',
          action: {
            label: '재시도',
            onClick: () => {
              setScanAttempts(0);
              setScanStartTime(Date.now());
              startScanTimeout();
            }
          }
        });
        stopScanning();
      }
    }, 5000);
  }, [isScanning]);

  // 스캔 중지
  const stopScanning = useCallback(() => {
    if (controlsRef.current && controlsRef.current.stop) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // ZXing 스캐너 시작
  const startZXingScanner = useCallback(() => {
    if (!videoRef.current || !stream) return;

    try {
      // 기존 리더 정리
      stopScanning();

      // 새 ZXing 리더 생성
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      console.log('Starting ZXing scanner with enhanced settings...');
      
      // 연속 바코드 디코딩 시작
      const controls = reader.decodeFromVideoDevice(
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
              
              // 스캔 성공 처리
              stopScanning();
              toast.success('ISBN을 성공적으로 인식했습니다!');
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
          }
        }
      );
      
      // Handle both Promise and direct return types
      if (controls && typeof controls.then === 'function') {
        controls.then((resolvedControls: any) => {
          controlsRef.current = resolvedControls;
        });
      } else {
        controlsRef.current = controls;
      }

    } catch (err) {
      console.error('ZXing scanner initialization failed:', err);
      setError('바코드 스캐너 초기화에 실패했습니다.');
    }
  }, [stream, onScan, onClose, stopScanning]);

  // ISBN 형식 검증 (향상된 버전)
  const validateISBN = (text: string): string | null => {
    // 공백과 하이픈, 기타 특수문자 제거
    const cleanText = text.replace(/[-\s\.]/g, '').trim();
    
    // ISBN-10 또는 ISBN-13 형식 검증
    const isbn10Pattern = /^\d{9}[\dX]$/i;
    const isbn13Pattern = /^97[89]\d{10}$/;
    
    // 더 엄격한 형식 검사
    if (cleanText.length >= 10 && cleanText.length <= 13) {
      if (isbn10Pattern.test(cleanText) || isbn13Pattern.test(cleanText)) {
        return cleanText;
      }
      
      // 부분적으로 일치하는 경우도 검사 (예: 앞에 0이 붙은 경우)
      const trimmedText = cleanText.replace(/^0+/, '');
      if (isbn10Pattern.test(trimmedText) || isbn13Pattern.test(trimmedText)) {
        return trimmedText;
      }
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
      // 환경 체크 후 카메라 초기화
      checkEnvironment();
      if (isHttpsSecure && hasMediaSupport) {
        initializeCamera();
      }
    } else {
      // 정리 작업
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      stopScanning();
      setError(null);
      setScanAttempts(0);
      setScanStartTime(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopScanning();
    };
  }, [isOpen, initializeCamera, stream, isHttpsSecure, hasMediaSupport, checkEnvironment, stopScanning]);

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

        {/* HTTPS 환경 체크 경고 */}
        {!isHttpsSecure && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              카메라 스캔 기능은 HTTPS 환경에서만 작동합니다. 수동으로 ISBN을 입력해주세요.
            </AlertDescription>
          </Alert>
        )}

        {/* 브라우저 지원 체크 경고 */}
        {!hasMediaSupport && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              이 브라우저는 카메라 기능을 지원하지 않습니다. 수동으로 ISBN을 입력해주세요.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {(isHttpsSecure && hasMediaSupport) && (
          <div className="relative mb-4">
            <video
              ref={videoRef}
              className="w-full h-64 bg-gray-900 rounded-lg"
              autoPlay
              playsInline
              muted
            />
            
            {/* 개선된 스캔 가이드 오버레이 */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* 스캔 프레임 */}
                <div className="relative">
                  <div className="w-48 h-32 border-2 border-primary rounded-lg bg-transparent">
                    {/* 모서리 가이드 */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary"></div>
                  </div>
                  
                  {/* 스캔 라인 */}
                  <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-primary animate-pulse transform -translate-y-1/2"></div>
                  
                  {/* 안내 텍스트 */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    바코드를 프레임에 맞춰주세요
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(isHttpsSecure && hasMediaSupport) && (
          <div className="flex gap-2 mb-4">
            <Button
              onClick={switchCamera}
              variant="outline"
              className="flex-1"
              disabled={isProcessing || !isScanning}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              카메라 전환
            </Button>
            
            <Button
              onClick={() => {
                setScanAttempts(0);
                setScanStartTime(Date.now());
                startZXingScanner();
                startScanTimeout();
              }}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              <Scan className="h-4 w-4 mr-2" />
              다시 스캔
            </Button>
          </div>
        )}

        {/* 테스트 버튼 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            onClick={handleManualScan}
            variant="outline"
            className="w-full mb-4"
            disabled={isProcessing}
          >
            <Scan className="h-4 w-4 mr-2" />
            테스트 스캔 (개발용)
          </Button>
        )}

        <div className="text-sm text-muted-foreground text-center space-y-2">
          {!isHttpsSecure || !hasMediaSupport ? (
            <p className="text-orange-600">카메라 스캔을 사용할 수 없습니다. 수동 입력을 이용해주세요.</p>
          ) : isScanning ? (
            <>
              <p>바코드를 카메라 중앙 프레임에 맞춰주세요</p>
              <p className="text-primary">
                스캔 시도: {scanAttempts}회 | 
                {scanStartTime && ` 경과 시간: ${Math.floor((Date.now() - scanStartTime) / 1000)}초`}
              </p>
              <p className="text-xs text-muted-foreground">
                💡 팁: 충분한 조명과 안정된 손으로 바코드를 선명하게 비춰주세요
              </p>
            </>
          ) : (
            <p>스캔을 시작하려면 잠시 기다려주세요...</p>
          )}
        </div>
      </Card>
    </div>
  );
};