import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapSearchResult {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  transaction_type: string;
  general_area: string;
}

export const useMapSearch = () => {
  const [mapBooks, setMapBooks] = useState<MapSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBooksOnMap = useCallback(async (
    userLat?: number, 
    userLng?: number, 
    maxDistance: number = 50
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_books_for_map', {
        user_latitude: userLat || null,
        user_longitude: userLng || null,
        max_distance_km: maxDistance
      });

      if (rpcError) {
        throw rpcError;
      }

      setMapBooks(data || []);
    } catch (err) {
      console.error('Error searching books on map:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mapBooks,
    loading,
    error,
    searchBooksOnMap
  };
};