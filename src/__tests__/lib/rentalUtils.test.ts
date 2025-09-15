import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUserCanBorrow } from '@/lib/rentalUtils';

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockSupabaseEq = vi.fn();
const mockSupabaseNot = vi.fn();
const mockSupabaseLt = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

describe('rentalUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup the mock chain
    mockSupabaseLt.mockReturnValue(Promise.resolve({ data: [], error: null }));
    mockSupabaseNot.mockReturnValue({ lt: mockSupabaseLt });
    mockSupabaseEq.mockReturnValue({ not: mockSupabaseNot });
    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect });
  });

  describe('checkUserCanBorrow', () => {
    it('should return canBorrow: true when user has no overdue transactions', async () => {
      // Mock successful query with no overdue transactions
      mockSupabaseLt.mockReturnValue(Promise.resolve({ 
        data: [], 
        error: null 
      }));

      const result = await checkUserCanBorrow('user-123');

      expect(result.canBorrow).toBe(true);
      expect(result.pendingTransactions).toEqual([]);
      expect(mockSupabaseFrom).toHaveBeenCalledWith('transactions');
    });

    it('should return canBorrow: false when user has overdue transactions', async () => {
      const overdueTransactions = [
        { id: 'tx-1', status: 'in_progress', book_id: 'book-1' },
        { id: 'tx-2', status: 'in_progress', book_id: 'book-2' }
      ];

      mockSupabaseLt.mockReturnValue(Promise.resolve({ 
        data: overdueTransactions, 
        error: null 
      }));

      const result = await checkUserCanBorrow('user-123');

      expect(result.canBorrow).toBe(false);
      expect(result.pendingTransactions).toEqual(overdueTransactions);
    });

    it('should return canBorrow: true when database query fails', async () => {
      mockSupabaseLt.mockReturnValue(Promise.resolve({ 
        data: null, 
        error: new Error('Database connection failed') 
      }));

      const result = await checkUserCanBorrow('user-123');

      expect(result.canBorrow).toBe(true);
      expect(result.pendingTransactions).toEqual([]);
    });

    it('should handle null data gracefully', async () => {
      mockSupabaseLt.mockReturnValue(Promise.resolve({ 
        data: null, 
        error: null 
      }));

      const result = await checkUserCanBorrow('user-123');

      expect(result.canBorrow).toBe(true);
      expect(result.pendingTransactions).toEqual([]);
    });

    it('should handle exceptions gracefully', async () => {
      mockSupabaseLt.mockRejectedValue(new Error('Network error'));

      const result = await checkUserCanBorrow('user-123');

      expect(result.canBorrow).toBe(true);
      expect(result.pendingTransactions).toEqual([]);
    });

    it('should build correct query chain', async () => {
      await checkUserCanBorrow('user-123');

      expect(mockSupabaseFrom).toHaveBeenCalledWith('transactions');
      expect(mockSupabaseSelect).toHaveBeenCalledWith('id, status, book_id');
      expect(mockSupabaseEq).toHaveBeenCalledWith('borrower_id', 'user-123');
      expect(mockSupabaseEq).toHaveBeenCalledWith('status', 'in_progress');
      expect(mockSupabaseNot).toHaveBeenCalledWith('return_deadline', 'is', null);
      expect(mockSupabaseLt).toHaveBeenCalledWith('return_deadline', expect.any(String));
    });
  });
});