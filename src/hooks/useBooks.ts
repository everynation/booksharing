import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance } from '@/utils/distance';

interface BookProfile {
  display_name: string | null;
  address: string | null;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  cover_image_url: string | null;
  transaction_type: string;
  price: number;
  status: string;
  created_at: string;
  description: string | null;
  rental_daily: number | null;
  weekly_rate: number | null;
  rental_weekly: number | null;
  daily_rate: number | null;
  late_daily: number | null;
  late_fee_per_day: number | null;
  new_book_price: number | null;
  rental_terms: string | null;
  for_rental: boolean | null;
  for_sale: boolean | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  profiles: BookProfile | null;
  distance?: number;
}

interface UseBooksParams {
  transactionType: "all" | "sale" | "rental";
  sortBy: "created_at" | "price" | "title" | "distance";
  userLat?: number | null;
  userLng?: number | null;
}

export const useBooks = ({ transactionType, sortBy, userLat, userLng }: UseBooksParams) => {
  return useQuery({
    queryKey: ['books', transactionType, sortBy, userLat, userLng],
    queryFn: async () => {
      // Build query with filters and sorting
      let query = supabase
        .from('books')
        .select(`
          id,
          title,
          author,
          isbn,
          cover_image_url,
          transaction_type,
          price,
          status,
          created_at,
          description,
          rental_daily,
          weekly_rate,
          rental_weekly,
          daily_rate,
          late_daily,
          late_fee_per_day,
          new_book_price,
          rental_terms,
          for_rental,
          for_sale,
          latitude,
          longitude,
          address
        `)
        .eq('status', 'available');

      // Apply transaction type filter on the server
      if (transactionType !== "all") {
        query = query.eq('transaction_type', transactionType);
      }

      // Apply sorting on the server (except distance)
      if (sortBy !== "distance") {
        const ascending = sortBy === "title";
        query = query.order(sortBy, { ascending });
      }

      const { data: booksData, error } = await query;

      if (error) {
        throw error;
      }

      if (!booksData || booksData.length === 0) {
        return [];
      }

      // Calculate distances and add profiles (client-side processing)
      const booksWithDistance = booksData.map(book => {
        let distance: number | undefined;
        
        // Only calculate distance if both book and user have location
        if (book.latitude && book.longitude && userLat && userLng) {
          distance = calculateDistance(userLat, userLng, book.latitude, book.longitude);
        }

        // Get general area from address (first part before comma)
        const generalArea = book.address ? 
          book.address.split(',')[0].trim() : '위치 정보 없음';

        return {
          ...book,
          distance,
          profiles: {
            display_name: "익명", // Hide owner identity for security
            address: generalArea // Only show general area
          }
        };
      });

      // Client-side distance sorting if needed
      if (sortBy === "distance") {
        booksWithDistance.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }

      return booksWithDistance;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};