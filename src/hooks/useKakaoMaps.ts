import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_SDK_URL = "//dapi.kakao.com/v2/maps/sdk.js?appkey=42c2269af0526cb8e15cc15e95efb23c&libraries=services";

export function useKakaoMaps() {
  const [ready, setReady] = useState<boolean>(
    typeof window !== 'undefined' && !!(window.kakao && window.kakao.maps && window.kakao.maps.services)
  );
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  const ensureLoaded = useCallback((): Promise<void> => {
    if (ready) return Promise.resolve();
    if (loadingPromiseRef.current) return loadingPromiseRef.current;

    loadingPromiseRef.current = new Promise<void>((resolve, reject) => {
      const markReady = () => {
        // Try to run maps.load if available to ensure full init
        if (window.kakao && window.kakao.maps && typeof window.kakao.maps.load === 'function') {
          window.kakao.maps.load(() => {
            setReady(!!(window.kakao && window.kakao.maps && window.kakao.maps.services));
            resolve();
          });
          return;
        }
        setReady(!!(window.kakao && window.kakao.maps && window.kakao.maps.services));
        resolve();
      };

      // If kakao object is already present
      if (window.kakao && window.kakao.maps) {
        markReady();
        return;
      }

      // Check if script already exists
      let script = document.querySelector(
        'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
      ) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.src = KAKAO_SDK_URL;
        script.async = true;
        script.onload = markReady;
        script.onerror = () => reject(new Error('Kakao Maps SDK load failed'));
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', markReady, { once: true });
        script.addEventListener('error', () => reject(new Error('Kakao Maps SDK load failed')), { once: true });
        // If it was already loaded before listeners attached
        if ((script as any).readyState === 'complete') {
          markReady();
        }
      }
    });

    return loadingPromiseRef.current;
  }, [ready]);

  useEffect(() => {
    if (ready) return;
    // best effort: if kakao is already there, mark as ready
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      setReady(true);
    }
  }, [ready]);

  return { ready, ensureLoaded };
}
