import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Sun, ZoomIn, ZoomOut, RotateCcw, Settings, Scan, Focus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface ISBNScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const ISBNScanner: React.FC<ISBNScannerProps> = ({ onScan, onClose, isOpen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number }>({ min: 1, max: 1, step: 0.1 });
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [scanAttempts, setScanAttempts] = useState(0);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusMode, setFocusMode] = useState<'auto' | 'manual'>('auto');
  const [manualFocus, setManualFocus] = useState<number>(0);
  
  const animationFrameRef = useRef<number>();
  const scanIntervalRef = useRef<NodeJS.Timeout>();
  const focusIntervalRef = useRef<NodeJS.Timeout>();
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // 기기 감지
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isGalaxy = userAgent.includes('samsung') || userAgent.includes('galaxy');
    
    return { isIOS, isAndroid, isGalaxy };
  };

  // ZXing 스캐너 초기화 - 더 강력한 바코드 인식
  const initializeZXingScanner = useCallback(async () => {
    if (!isOpen || !stream) return;

    try {
      setError(null);
      console.log('Initializing ZXing scanner...');
      
      const { isIOS, isAndroid, isGalaxy } = getDeviceInfo();
      
      // ZXing 리더 생성
      const reader = new BrowserMultiFormatReader();
      zxingReaderRef.current = reader;
      
      // 플랫폼별 최적화 힌트 설정
      const hints = new Map();
      
      // iOS 최적화
      if (isIOS) {
        hints.set('TRY_HARDER', true);
        hints.set('POSSIBLE_FORMATS', ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128']);
        console.log('iOS: ZXing optimized for iOS devices');
      }
      // Android 최적화
      else if (isAndroid) {
        hints.set('TRY_HARDER', true);
        hints.set('POSSIBLE_FORMATS', ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128']);
        hints.set('ASSUME_GS1', false);
        console.log('Android: ZXing optimized for Android devices');
      }
      // 갤럭시 특별 최적화
      else if (isGalaxy) {
        hints.set('TRY_HARDER', true);
        hints.set('PURE_BARCODE', false);
        hints.set('POSSIBLE_FORMATS', ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E']);
        hints.set('ASSUME_GS1', false);
        console.log('Galaxy: ZXing special optimization for Galaxy devices');
      }
      
      // 비디오 요소 확인
      if (!videoRef.current) {
        console.error('Video element not available');
        setError('비디오 요소를 찾을 수 없습니다.');
        return;
      }

      console.log('Starting ZXing continuous decode...');
      setIsScanning(true);

      // 연속 바코드 디코딩 시작
      const result = await reader.decodeFromVideoDevice(
        undefined, // 기본 비디오 입력 장치 사용
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log('ZXing: Barcode detected:', result.getText());
            const isbn = result.getText().replace(/[-\s]/g, '');
            
            // ISBN 형식 검증 (더 엄격한 검증)
            if (/^(?:97[89])?\d{9}[\dX]$/i.test(isbn)) {
              console.log('ZXing: Valid ISBN detected:', isbn);
              setIsProcessing(true);
              
              // 스캔 성공 후 정리
              try {
                // ZXing 스캔 완료, 정리는 onClose에서 처리
                console.log('ZXing: Scan completed successfully');
              } catch (e) {
                console.warn('Error handling scan completion:', e);
              }
              
              onScan(isbn);
              onClose();
              return;
            } else {
              console.log('ZXing: Invalid ISBN format:', isbn);
            }
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.warn('ZXing decode error:', error);
            setScanAttempts(prev => prev + 1);
          }
          
          // 스캔 시도 카운트 업데이트
          setScanAttempts(prev => prev + 1);
        }
      );

    } catch (err) {
      console.error('ZXing scanner initialization failed:', err);
      setError(`바코드 스캐너 초기화 실패: ${err.message}`);
      setIsScanning(false);
    }
  }, [isOpen, stream, onScan, onClose]);

  // 카메라 초기화 (Quagga와 별도로) - 안드로이드 호환성 향상
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting camera initialization...');
      
      // 먼저 미디어 장치 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('이 브라우저는 카메라를 지원하지 않습니다.');
        return;
      }
      
      const { isIOS, isAndroid, isGalaxy } = getDeviceInfo();
      console.log('Device info:', { isIOS, isAndroid, isGalaxy });
      
      // 안드로이드에서 더 안전한 단계별 카메라 접근
      if (isAndroid) {
        console.log('Android device detected, using safe camera initialization...');
        
        // 1단계: 최소 요구사항으로 시도
        try {
          console.log('Android: Trying basic camera access...');
          const basicStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing
            }
          });
          
          console.log('Android: Basic camera access successful');
          setStream(basicStream);
          
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            await videoRef.current.play();
            console.log('Android: Video element ready');
          }
          
          // 카메라 기능 설정 (안드로이드에서는 간소화)
          const track = basicStream.getVideoTracks()[0];
          if (track) {
            await setupCameraFeatures(track);
          }
          
      // ZXing 스캐너 초기화
      console.log('Android: Starting ZXing scanner initialization...');
      await initializeZXingScanner();
          return;
          
        } catch (basicErr) {
          console.error('Android: Basic camera access failed:', basicErr);
          
          // 2단계: 권한 문제인 경우 명확한 메시지
          if (basicErr.name === 'NotAllowedError') {
            setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
            return;
          }
          
          // 3단계: 다른 카메라로 시도
          try {
            console.log('Android: Trying front camera...');
            const frontStream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' }
            });
            
            setStream(frontStream);
            if (videoRef.current) {
              videoRef.current.srcObject = frontStream;
              await videoRef.current.play();
            }
            
            await initializeZXingScanner();
            return;
            
          } catch (frontErr) {
            console.error('Android: Front camera also failed:', frontErr);
            setError('안드로이드 카메라에 접근할 수 없습니다. 다른 브라우저를 시도해보세요.');
            return;
          }
        }
      }
      
      // 기존 로직 (iOS 및 기타 기기)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        }
      };

      // iOS 최적화 설정
      if (isIOS) {
        (constraints.video as any) = {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 }
        };
      }

      // 갤럭시 특별 설정
      if (isGalaxy) {
        (constraints.video as any) = {
          facingMode: cameraFacing,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 }
        };
      }

      console.log('Using constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // 카메라 기능 설정
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        await setupCameraFeatures(track);
      }

      // ZXing 스캐너 초기화
      await initializeZXingScanner();
      
    } catch (err) {
      console.error('Camera initialization failed:', err);
      
      // 오류 타입별 명확한 메시지
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 기기에 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError') {
        setError('카메라가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.');
      } else {
        setError(`카메라 오류: ${err.message || '알 수 없는 오류'}`);
      }
    }
  }, [cameraFacing, initializeZXingScanner]);

  // 카메라 기능 설정
  const setupCameraFeatures = async (track: MediaStreamTrack) => {
    try {
      const { isIOS, isAndroid, isGalaxy } = getDeviceInfo();
      
      // 자동 초점 설정 - iOS와 Android에서 더 적극적으로 시도
      try {
        // iOS에서 더 나은 초점 설정
        if (isIOS) {
          await (track as any).applyConstraints({
            advanced: [
              { focusMode: 'continuous' },
              { exposureMode: 'continuous' },
              { whiteBalanceMode: 'continuous' }
            ]
          });
        }
        // Android에서 더 나은 초점 설정
        else if (isAndroid) {
          await (track as any).applyConstraints({
            advanced: [
              { focusMode: 'continuous' },
              { exposureMode: 'continuous' },
              { whiteBalanceMode: 'continuous' }
            ]
          });
        }
        // 갤럭시 특별 설정 - 더 적극적인 초점 제어
        else if (isGalaxy) {
          try {
            await (track as any).applyConstraints({
              advanced: [
                { focusMode: 'continuous' },
                { exposureMode: 'continuous' },
                { whiteBalanceMode: 'continuous' }
              ]
            });
            console.log('Galaxy: Advanced camera constraints applied successfully');
          } catch (e) {
            console.warn('Galaxy: Advanced constraints failed, trying basic:', e);
            try {
              await (track as any).applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
              });
            } catch (basicErr) {
              console.warn('Galaxy: Basic focus mode also failed:', basicErr);
            }
          }
          
          // 갤럭시에서 주기적으로 초점 재설정
          focusIntervalRef.current = setInterval(async () => {
            try {
              await (track as any).applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
              });
              console.log('Galaxy: Focus reset applied');
            } catch (e) {
              console.warn('Galaxy: Focus reset failed:', e);
            }
          }, 1000); // 1초마다 초점 재설정
        }
        // 일반적인 설정
        else {
          await (track as any).applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          });
        }
      } catch (e) {
        console.warn('Advanced camera constraints not supported:', e);
        
        // 기본 초점 설정 시도
        try {
          await (track as any).applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          });
        } catch (basicFocusErr) {
          console.warn('Basic focus mode not supported:', basicFocusErr);
        }
      }
      
      // 카메라 기능 확인
      const capabilities = track.getCapabilities();
      if (capabilities) {
        // 손전등
        if ('torch' in capabilities) {
          setTorchAvailable(true);
        }
        
        // 줌
        if ('zoom' in capabilities) {
          setZoomSupported(true);
          const zoomCap = capabilities.zoom as any;
          if (zoomCap) {
            setZoomRange({ 
              min: zoomCap.min ?? 1, 
              max: zoomCap.max ?? 1, 
              step: zoomCap.step ?? 0.1 
            });
            const settings = track.getSettings();
            if ('zoom' in settings) {
              setZoom((settings as any).zoom ?? 1);
            }
          }
        }
        
        // 수동 초점 지원 확인
        if ('focusDistance' in capabilities) {
          setFocusMode('manual');
          const focusCap = capabilities.focusDistance as any;
          if (focusCap) {
            setManualFocus(focusCap.min ?? 0);
          }
        }
      }
      
      // iOS와 Android에서 자동 초점을 위한 추가 설정
      if (isIOS || isAndroid) {
        // 비디오 요소에 자동 초점을 위한 속성 추가
        if (videoRef.current) {
          videoRef.current.style.objectFit = 'cover';
          videoRef.current.style.objectPosition = 'center';
        }
      }
    } catch (e) {
      console.warn('Camera features setup failed:', e);
    }
  };

  // 수동 초점 조정
  const handleManualFocus = async (value: number) => {
    if (!stream) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      if (track) {
        await (track as any).applyConstraints({
          advanced: [{ focusDistance: value }]
        });
        setManualFocus(value);
      }
    } catch (e) {
      console.error('Manual focus change failed:', e);
    }
  };

  // 손전등 토글
  const toggleTorch = async () => {
    if (!stream || !torchAvailable) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const nextTorch = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setTorchOn(nextTorch);
      }
    } catch (e) {
      console.error('Torch toggle failed:', e);
    }
  };

  // 줌 변경
  const handleZoomChange = async (value: number) => {
    if (!stream || !zoomSupported) return;
    
    try {
      const track = stream.getVideoTracks()[0];
      if (track) {
        await (track as any).applyConstraints({
          advanced: [{ zoom: value }]
        });
        setZoom(value);
      }
    } catch (e) {
      console.error('Zoom change failed:', e);
    }
  };

  // 카메라 전환
  const switchCamera = () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    
    // ZXing 스캐너 정리
    if (zxingReaderRef.current) {
      try {
        // ZXing reader 리셋
        zxingReaderRef.current = null;
      } catch (e) {
        console.warn('Error stopping ZXing decoder:', e);
      }
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
    }
    
    setTimeout(async () => {
      await initializeCamera();
    }, 100);
  };

  // 수동 ISBN 입력 (fallback)
  const handleManualInput = () => {
    const isbn = prompt('ISBN을 직접 입력해주세요:');
    if (isbn && /^(?:97[89])?\d{9}[\dX]$/i.test(isbn.replace(/[-\s]/g, ''))) {
      onScan(isbn.replace(/[-\s]/g, ''));
      onClose();
    } else if (isbn) {
      alert('올바른 ISBN 형식이 아닙니다.');
    }
  };

  // 컴포넌트 마운트 시 초기화
  // ZXing 스캐너 시작 (stream이 준비된 후)
  useEffect(() => {
    if (isOpen && stream) {
      initializeZXingScanner();
    }
  }, [isOpen, stream, initializeZXingScanner]);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    }

    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      if (zxingReaderRef.current) {
        try {
          // ZXing reader 정리
          zxingReaderRef.current = null;
        } catch (e) {
          console.warn('Error stopping ZXing decoder:', e);
        }
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, initializeCamera]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (zxingReaderRef.current) {
        try {
          // ZXing reader 정리
          zxingReaderRef.current = null;
        } catch (e) {
          console.warn('Error stopping ZXing decoder:', e);
        }
      }
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              ISBN 바코드 스캔 (ZXing)
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <Alert className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full">
                  다시 시도
                </Button>
                <Button variant="outline" onClick={handleManualInput} className="w-full">
                  ISBN 직접 입력
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 비디오 컨테이너 */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* 스캔 가이드 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary border-dashed w-3/4 h-1/2 rounded-lg animate-pulse" />
                </div>

                {/* 스캔 중 표시 */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-2">
                      <Scan className="h-5 w-5 animate-pulse text-primary" />
                      <span className="text-sm font-medium">바코드 인식 중...</span>
                    </div>
                  </div>
                )}

                {/* 컨트롤 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    {/* 카메라 전환 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={switchCamera}
                      className="text-white hover:bg-white/20"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>

                    {/* 손전등 */}
                    {torchAvailable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTorch}
                        className={`text-white hover:bg-white/20 ${torchOn ? 'bg-yellow-500/20' : ''}`}
                      >
                        <Sun className="h-4 w-4" />
                      </Button>
                    )}

                    {/* 줌 컨트롤 */}
                    {zoomSupported && (
                      <div className="flex items-center gap-2">
                        <ZoomOut className="h-4 w-4 text-white" />
                        <div className="w-24">
                          <Slider
                            value={[zoom]}
                            min={zoomRange.min}
                            max={zoomRange.max}
                            step={zoomRange.step}
                            onValueChange={(v) => handleZoomChange(v[0])}
                            className="[&_[role=slider]]:bg-white"
                          />
                        </div>
                        <ZoomIn className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 수동 초점 조정 (갤럭시용) */}
              {focusMode === 'manual' && getDeviceInfo().isGalaxy && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Focus className="h-4 w-4" />
                    <span className="text-sm font-medium">수동 초점 조정</span>
                  </div>
                  <Slider
                    value={[manualFocus]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(v) => handleManualFocus(v[0])}
                  />
                </div>
              )}

              {/* 안내 메시지 */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  📚 책 뒷면의 ISBN 바코드를 프레임 안에 맞춰주세요
                </p>
                {isScanning && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-sm">스캔 중... (시도: {scanAttempts})</span>
                  </div>
                )}
                
                {/* 기기별 특별 안내 */}
                {(() => {
                  const { isIOS, isAndroid, isGalaxy } = getDeviceInfo();
                  if (isIOS) {
                    return (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 iOS 사용자: ZXing 라이브러리로 강력한 바코드 인식. 바코드를 프레임 안에 안정적으로 유지해주세요
                      </div>
                    );
                  } else if (isAndroid) {
                    return (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        💡 Android 사용자: ZXing 라이브러리로 개선된 바코드 인식. 충분한 조명과 안정적인 카메라 고정이 중요합니다
                      </div>
                    );
                  } else if (isGalaxy) {
                    return (
                      <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        💡 갤럭시 사용자: ZXing + 수동 초점 조정으로 초점 문제 해결! 위의 수동 초점 슬라이더를 사용해보세요
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* 수동 입력 버튼 */}
              <Button variant="outline" onClick={handleManualInput} className="w-full">
                📝 ISBN 직접 입력하기
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};