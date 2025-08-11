declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name: string;
      type: string;
      target: HTMLElement | null;
      constraints: {
        width: { min: number; ideal: number; max: number };
        height: { min: number; ideal: number; max: number };
        facingMode: string;
        aspectRatio: { min: number; max: number };
      };
      area: {
        top: string;
        right: string;
        left: string;
        bottom: string;
      };
    };
    locator: {
      patchSize: string;
      halfSample: boolean;
    };
    numOfWorkers: number;
    frequency: number;
    decoder: {
      readers: string[];
    };
    locate: boolean;
  }

  interface QuaggaResult {
    codeResult: {
      code: string;
      format: string;
    };
  }

  interface QuaggaError {
    name: string;
    message: string;
  }

  function init(config: QuaggaConfig, callback: (error: QuaggaError | null) => void): void;
  function start(): void;
  function stop(): void;
  function onDetected(callback: (result: QuaggaResult) => void): void;
  function onProcessed(callback: (result: QuaggaResult | null) => void): void;

  export default {
    init,
    start,
    stop,
    onDetected,
    onProcessed
  };
}
