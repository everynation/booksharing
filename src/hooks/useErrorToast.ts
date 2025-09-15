import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ErrorToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useErrorToast = () => {
  const showError = useCallback((error: unknown, options: ErrorToastOptions = {}) => {
    const {
      title = "오류가 발생했습니다",
      description = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      variant = "destructive"
    } = options;

    console.error('Error:', error);
    
    toast({
      title,
      description,
      variant,
    });
  }, []);

  const showSuccess = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, []);

  const showInfo = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, []);

  return {
    showError,
    showSuccess,
    showInfo,
  };
};