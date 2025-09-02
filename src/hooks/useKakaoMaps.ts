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

    loadingPromiseRef.current = new Promise<void>(async (resolve, reject) => {
      console.log("[useKakaoMaps] Starting new loading process");
      
      try {
        // Get API key securely from edge function
        const apiKey = await getKakaoApiKey();
        const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;

        // Remove existing script if any
        const existingScript = document.querySelector('script[src*="dapi.kakao.com/v2/maps/sdk.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        console.log("[useKakaoMaps] Creating new script");
        const script = document.createElement('script');
        script.src = KAKAO_SDK_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log("[useKakaoMaps] Script loaded successfully");
          // Add a small delay to ensure kakao object is fully initialized
          setTimeout(() => {
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
          }, 100);
        };
        
        script.onerror = (error) => {
          console.error("[useKakaoMaps] Script load failed:", error);
          reject(new Error('Kakao Maps SDK load failed'));
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error("[useKakaoMaps] Error loading Kakao API:", error);
        reject(error);
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
