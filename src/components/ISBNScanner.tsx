import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Sun, ZoomIn, ZoomOut, RotateCcw, Settings, Scan, Focus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Quagga from 'quagga';

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
  const quaggaRef = useRef<any>(null);

  // 기기 감지
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isGalaxy = userAgent.includes('samsung') || userAgent.includes('galaxy');
    
    return { isIOS, isAndroid, isGalaxy };
  };

  // Quagga 초기화
  const initializeQuagga = useCallback(() => {
    if (!isOpen) return;

    try {
      const { isGalaxy } = getDeviceInfo();
      
      // 갤럭시 특별 설정
      const quaggaConfig = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            width: { min: 320, ideal: 640, max: 1280 },
            height: { min: 240, ideal: 480, max: 720 },
            facingMode: cameraFacing,
            aspectRatio: { min: 1, max: 2 }
          },
          area: { // 스캔 영역 제한으로 정확도 향상
            top: "20%",
            right: "15%",
            left: "15%",
            bottom: "20%"
          }
        },
        locator: {
          patchSize: isGalaxy ? "small" : "medium", // 갤럭시에서는 작은 패치 사용
          halfSample: isGalaxy ? false : true // 갤럭시에서는 halfSample 비활성화
        },
        numOfWorkers: isGalaxy ? 2 : (navigator.hardwareConcurrency || 4), // 갤럭시에서는 워커 수 줄임
        frequency: isGalaxy ? 5 : 10, // 갤럭시에서는 스캔 빈도 줄임
        decoder: {
          readers: [
            "ean_reader",
            "ean_8_reader",
            "code_128_reader",
            "code_39_reader",
            "upc_reader",
            "upc_e_reader"
          ]
        },
        locate: true
      };

      console.log('Quagga config for device:', getDeviceInfo(), quaggaConfig);

      Quagga.init(quaggaConfig, (err: any) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          
          // 갤럭시에서 실패 시 더 간단한 설정으로 재시도
          if (getDeviceInfo().isGalaxy) {
            console.log('Trying fallback Quagga config for Galaxy...');
                         const fallbackConfig = {
               ...quaggaConfig,
               inputStream: {
                 ...quaggaConfig.inputStream,
                 constraints: {
                   width: { min: 320, ideal: 320, max: 320 },
                   height: { min: 240, ideal: 240, max: 240 },
                   facingMode: cameraFacing,
                   aspectRatio: { min: 1, max: 2 }
                 }
               },
               numOfWorkers: 1,
               frequency: 3
             };
            
            Quagga.init(fallbackConfig, (fallbackErr: any) => {
              if (fallbackErr) {
                console.error('Fallback Quagga also failed:', fallbackErr);
                setError('갤럭시에서 바코드 스캐너를 초기화할 수 없습니다. 다른 방법을 시도해보세요.');
                return;
              }
              
              console.log('Fallback Quagga initialized successfully');
              setIsScanning(true);
              startQuaggaScanning();
            });
          } else {
            setError('바코드 스캐너 초기화에 실패했습니다.');
          }
          return;
        }
        
        console.log('Quagga initialized successfully');
        setIsScanning(true);
        startQuaggaScanning();
      });

    } catch (err) {
      console.error('Quagga setup error:', err);
      setError('바코드 스캐너 설정에 실패했습니다.');
    }
  }, [isOpen, cameraFacing]);

  // Quagga 스캔 시작
  const startQuaggaScanning = useCallback(() => {
    if (!isScanning) return;

    console.log('Starting Quagga scanning...');
    Quagga.start();

    // 바코드 감지 이벤트
    Quagga.onDetected((result: any) => {
      console.log('Barcode detected:', result);
      const isbn = result.codeResult.code.replace(/[-\s]/g, '');
      
      // ISBN 형식 검증
      if (/^(?:97[89])?\d{9}[\dX]$/i.test(isbn)) {
        setIsProcessing(true);
        onScan(isbn);
        onClose();
        return;
      }
    });

    // 스캔 진행 상황 모니터링
    Quagga.onProcessed((result: any) => {
      if (result) {
        setScanAttempts(prev => prev + 1);
        console.log('Scan attempt:', result);
      }
    });

    // 갤럭시에서 추가 디버깅
    if (getDeviceInfo().isGalaxy) {
      console.log('Galaxy device: Enhanced debugging enabled');
      
      // 갤럭시에서 주기적으로 스캔 상태 확인
      const debugInterval = setInterval(() => {
        console.log('Galaxy scan status - attempts:', scanAttempts, 'scanning:', isScanning);
      }, 2000);
      
      // 정리 함수에 추가
      return () => clearInterval(debugInterval);
    }
  }, [isScanning, onScan, onClose, scanAttempts]);

  // 카메라 초기화 (Quagga와 별도로)
  const initializeCamera = useCallback(async () => {
    try {
      setError(null);
      
      const { isIOS, isAndroid, isGalaxy } = getDeviceInfo();
      
      // 기기별 최적화된 카메라 설정
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        }
      };

      // iOS와 Android에서 더 나은 카메라 설정
      if (isIOS || isAndroid) {
        if (isIOS) {
          (constraints.video as any) = {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 60 }
          };
        } else if (isAndroid) {
          (constraints.video as any) = {
            facingMode: cameraFacing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30, max: 60 }
          };
        }
      }

      // 갤럭시 특별 설정 - 더 낮은 해상도로 초점 안정성 향상
      if (isGalaxy) {
        (constraints.video as any) = {
          facingMode: cameraFacing,
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
          // 갤럭시에서 추가 설정
          deviceId: undefined, // 기본 카메라 사용
          groupId: undefined
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // 카메라 기능 설정
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        await setupCameraFeatures(track);
      }

      // Quagga 초기화
      initializeQuagga();
      
    } catch (err) {
      console.error('Camera initialization failed:', err);
      
      // 갤럭시에서 카메라 접근 실패 시 fallback
      if (getDeviceInfo().isGalaxy) {
        try {
          console.log('Trying fallback camera settings for Galaxy...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: cameraFacing,
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
          
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play();
          }
          
          initializeQuagga();
          
        } catch (fallbackErr) {
          console.error('Fallback camera also failed:', fallbackErr);
          setError('갤럭시에서 카메라에 접근할 수 없습니다. 브라우저 설정을 확인해주세요.');
        }
      } else {
        setError('카메라에 접근할 수 없습니다. 권한을 확인해주세요.');
      }
    }
  }, [cameraFacing, initializeQuagga]);

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
    
    // Quagga 정리
    if (quaggaRef.current) {
      Quagga.stop();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
    }
    
    setTimeout(() => {
      initializeCamera();
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
      if (quaggaRef.current) {
        Quagga.stop();
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
      if (quaggaRef.current) {
        Quagga.stop();
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
              ISBN 바코드 스캔 (QuaggaJS)
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
                        💡 iOS 사용자: QuaggaJS로 개선된 바코드 인식. 바코드를 프레임 안에 안정적으로 유지해주세요
                      </div>
                    );
                  } else if (isAndroid) {
                    return (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        💡 Android 사용자: QuaggaJS로 개선된 바코드 인식. 충분한 조명과 안정적인 카메라 고정이 중요합니다
                      </div>
                    );
                  } else if (isGalaxy) {
                    return (
                      <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded">
                        💡 갤럭시 사용자: QuaggaJS + 수동 초점 조정으로 초점 문제 해결! 위의 수동 초점 슬라이더를 사용해보세요
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