import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=42c2269af0526cb8e15cc15e95efb23c&libraries=services&autoload=false";

export function useKakaoMaps() {
  const [ready, setReady] = useState<boolean>(false);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  const ensureLoaded = useCallback((): Promise<void> => {
    console.log("[useKakaoMaps] ensureLoaded called");
    
    if (ready) {
      console.log("[useKakaoMaps] Already ready, returning immediately");
      return Promise.resolve();
    }
    
    if (loadingPromiseRef.current) {
      console.log("[useKakaoMaps] Loading already in progress, returning existing promise");
      return loadingPromiseRef.current;
    }

    loadingPromiseRef.current = new Promise<void>((resolve, reject) => {
      console.log("[useKakaoMaps] Starting new loading process");
      
      // 이미 로드된 경우
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        console.log("[useKakaoMaps] Kakao Maps already loaded");
        setReady(true);
        resolve();
        return;
      }

      // 스크립트가 이미 있는지 확인
      let script = document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]') as HTMLScriptElement;
      
      if (!script) {
        console.log("[useKakaoMaps] Creating new script");
        script = document.createElement('script');
        script.src = KAKAO_SDK_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log("[useKakaoMaps] Script loaded successfully");
          // 스크립트 로드 후 kakao.maps.load 호출
          if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
            window.kakao.maps.load(() => {
              console.log("[useKakaoMaps] Kakao maps.load callback executed");
              setReady(true);
              resolve();
            });
          } else {
            console.error("[useKakaoMaps] Kakao maps.load not available after script load");
            reject(new Error('Kakao Maps load function not available'));
          }
        };
        
        script.onerror = (error) => {
          console.error("[useKakaoMaps] Script load failed:", error);
          reject(new Error('Kakao Maps SDK load failed'));
        };
        
        document.head.appendChild(script);
      } else {
        console.log("[useKakaoMaps] Script already exists, checking if loaded");
        
        // 스크립트가 이미 로드된 경우
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          console.log("[useKakaoMaps] Script already loaded, calling kakao.maps.load");
          window.kakao.maps.load(() => {
            console.log("[useKakaoMaps] Kakao maps.load callback executed");
            setReady(true);
            resolve();
          });
        } else {
          console.log("[useKakaoMaps] Script exists but not fully loaded, waiting...");
          // 스크립트가 아직 로딩 중인 경우
          script.addEventListener('load', () => {
            console.log("[useKakaoMaps] Existing script loaded");
            if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
              window.kakao.maps.load(() => {
                console.log("[useKakaoMaps] Kakao maps.load callback executed");
                setReady(true);
                resolve();
              });
            } else {
              reject(new Error('Kakao Maps load function not available'));
            }
          }, { once: true });
        }
      }
    });

    return loadingPromiseRef.current;
  }, [ready]);

  useEffect(() => {
    // 컴포넌트 마운트 시 자동으로 로드 시도
    if (!ready && typeof window !== 'undefined') {
      console.log("[useKakaoMaps] Component mounted, attempting to load");
      ensureLoaded().catch((error) => {
        console.error("[useKakaoMaps] Failed to load on mount:", error);
      });
    }
  }, [ready, ensureLoaded]);

  return { ready, ensureLoaded };
}
