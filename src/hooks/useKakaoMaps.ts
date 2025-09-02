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
          resolve();
          return;
        }

        // Get API key
        console.log("[useKakaoMaps] Getting API key");
        const apiKey = await getKakaoApiKey();
        console.log("[useKakaoMaps] API key obtained");
        
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
        script.async = false; // Changed to false for better reliability
        script.defer = true;
        
        const timeoutId = setTimeout(() => {
          console.error("[useKakaoMaps] Script loading timeout");
          setError('지도 로딩 시간이 초과되었습니다.');
          reject(new Error('Script loading timeout'));
        }, 10000);
        
        script.onload = () => {
          console.log("[useKakaoMaps] Script loaded successfully");
          clearTimeout(timeoutId);
          
          // Wait a bit for kakao object to be available
          const checkKakao = () => {
            if (window.kakao && window.kakao.maps) {
              console.log("[useKakaoMaps] Kakao object available, calling kakao.maps.load");
              
              if (typeof window.kakao.maps.load === 'function') {
                window.kakao.maps.load(() => {
                  console.log("[useKakaoMaps] Kakao maps loaded successfully");
                  setReady(true);
                  setError(null);
                  loadingPromiseRef.current = null;
                  resolve();
                });
              } else {
                console.error("[useKakaoMaps] kakao.maps.load is not a function");
                setError('지도 초기화 함수를 찾을 수 없습니다.');
                reject(new Error('kakao.maps.load is not a function'));
              }
            } else {
              console.log("[useKakaoMaps] Kakao object not ready, retrying...");
              setTimeout(checkKakao, 100);
            }
          };
          
          checkKakao();
        };
        
        script.onerror = (error) => {
          console.error("[useKakaoMaps] Script load failed:", error);
          console.error("[useKakaoMaps] Script src was:", script.src);
          console.error("[useKakaoMaps] API key used:", apiKey);
          clearTimeout(timeoutId);
          setError('지도 API 로딩에 실패했습니다. API 키를 확인해 주세요.');
          reject(new Error('Kakao Maps SDK load failed'));
        };
        
        console.log("[useKakaoMaps] Appending script to head");
        document.head.appendChild(script);
        
      } catch (error) {
        console.error("[useKakaoMaps] Error in loading process:", error);
        setError('지도를 불러오는 중 오류가 발생했습니다.');
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
