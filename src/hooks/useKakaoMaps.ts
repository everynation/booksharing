import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    kakao: any;
  }
}

// Securely get Kakao API key from edge function
async function getKakaoApiKey(): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('get-kakao-api-key');
    
    if (error) {
      console.error('Error getting Kakao API key:', error);
      throw new Error('Failed to get API key');
    }
    
    return data.apiKey;
  } catch (error) {
    console.error('Failed to fetch Kakao API key:', error);
    throw new Error('API key not available');
  }
}

export function useKakaoMaps() {
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  const ensureLoaded = useCallback((): Promise<void> => {
    console.log("[useKakaoMaps] ensureLoaded called, ready:", ready);
    
    if (ready) {
      console.log("[useKakaoMaps] Already ready, returning immediately");
      return Promise.resolve();
    }
    
    if (loadingPromiseRef.current) {
      console.log("[useKakaoMaps] Loading already in progress, returning existing promise");
      return loadingPromiseRef.current;
    }

    loadingPromiseRef.current = new Promise<void>(async (resolve, reject) => {
      try {
        console.log("[useKakaoMaps] Starting new loading process");
        
        // Check if already loaded
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          console.log("[useKakaoMaps] Kakao Maps already loaded and ready");
          setReady(true);
          setError(null);
          loadingPromiseRef.current = null;
          resolve();
          return;
        }

        // Get API key with retry logic
        console.log("[useKakaoMaps] Getting API key");
        let apiKey: string;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            apiKey = await getKakaoApiKey();
            console.log("[useKakaoMaps] API key obtained");
            break;
          } catch (error) {
            retryCount++;
            console.error(`[useKakaoMaps] API key fetch failed (attempt ${retryCount}):`, error);
            if (retryCount >= maxRetries) {
              throw new Error('API 키를 가져올 수 없습니다. 네트워크 연결을 확인해주세요.');
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
        
        const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
        
        console.log("[useKakaoMaps] Using SDK URL:", KAKAO_SDK_URL);

        // Remove any existing script
        const existingScripts = document.querySelectorAll('script[src*="dapi.kakao.com"]');
        existingScripts.forEach(script => {
          console.log("[useKakaoMaps] Removing existing script");
          script.remove();
        });

        // Clear window.kakao if it exists
        if (window.kakao) {
          console.log("[useKakaoMaps] Clearing existing kakao object");
          delete window.kakao;
        }

        console.log("[useKakaoMaps] Creating new script element");
        const script = document.createElement('script');
        script.src = KAKAO_SDK_URL;
        script.async = false;
        script.defer = true;
        
        const timeoutId = setTimeout(() => {
          console.error("[useKakaoMaps] Script loading timeout");
          setError('지도 로딩 시간이 초과되었습니다. 페이지를 새로고침해주세요.');
          loadingPromiseRef.current = null;
          reject(new Error('Script loading timeout'));
        }, 15000); // Increased timeout to 15 seconds
        
        script.onload = () => {
          console.log('[useKakaoMaps] Script loaded successfully');
          clearTimeout(timeoutId);

          // Wait for kakao object to be available with better error handling
          let checkCount = 0;
          const maxChecks = 50; // 5 seconds max wait (100ms interval)

          const checkKakao = () => {
            checkCount++;

            if (window.kakao && window.kakao.maps) {
              console.log('[useKakaoMaps] Kakao object available, calling kakao.maps.load');

              if (typeof window.kakao.maps.load === 'function') {
                try {
                  window.kakao.maps.load(() => {
                    console.log('[useKakaoMaps] Kakao maps initialized successfully');
                    setReady(true);
                    setError(null);
                    loadingPromiseRef.current = null;
                    resolve();
                  });
                } catch (loadError) {
                  console.error('[useKakaoMaps] kakao.maps.load failed:', loadError);
                  setError('지도 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
                  loadingPromiseRef.current = null;
                  reject(new Error('kakao.maps.load failed'));
                }
              } else {
                console.error('[useKakaoMaps] kakao.maps.load is not a function');
                setError('지도 초기화 함수를 찾을 수 없습니다. 페이지를 새로고침해주세요.');
                loadingPromiseRef.current = null;
                reject(new Error('kakao.maps.load is not a function'));
              }
            } else if (checkCount >= maxChecks) {
              console.error('[useKakaoMaps] Kakao object not available after maximum checks');
              setError('지도 객체를 초기화할 수 없습니다. 페이지를 새로고침해주세요.');
              loadingPromiseRef.current = null;
              reject(new Error('Kakao object not available'));
            } else {
              console.log(`[useKakaoMaps] Kakao object not ready, retrying... (${checkCount}/${maxChecks})`);
              setTimeout(checkKakao, 100);
            }
          };

          // 스크립트 로드 후 즉시 초기화 시도
          setTimeout(checkKakao, 10);
        };
        
        script.onerror = (error) => {
          console.error("[useKakaoMaps] Script load failed:", error);
          console.error("[useKakaoMaps] Script src was:", script.src);
          clearTimeout(timeoutId);
          setError('지도 API 로딩에 실패했습니다. 네트워크 연결을 확인해주세요.');
          loadingPromiseRef.current = null;
          reject(new Error('Kakao Maps SDK load failed'));
        };
        
        console.log("[useKakaoMaps] Appending script to head");
        document.head.appendChild(script);
        
      } catch (error) {
        console.error("[useKakaoMaps] Error in loading process:", error);
        setError(error instanceof Error ? error.message : '지도를 불러오는 중 오류가 발생했습니다.');
        loadingPromiseRef.current = null;
        reject(error);
      }
    });

    return loadingPromiseRef.current;
  }, [ready]);

  useEffect(() => {
    if (!ready && typeof window !== 'undefined') {
      console.log("[useKakaoMaps] Component mounted, attempting to load");
      ensureLoaded().catch((error) => {
        console.error("[useKakaoMaps] Failed to load on mount:", error);
        setError('지도 로딩에 실패했습니다. 페이지를 새로고침해 주세요.');
      });
    }
  }, [ready, ensureLoaded]);

  return { ready, ensureLoaded, error };
}
