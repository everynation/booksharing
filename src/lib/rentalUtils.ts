import { supabase } from "@/integrations/supabase/client";

export interface PendingTransaction {
  id: string;
  status: string;
  book_id: string;
}

export const checkUserCanBorrow = async (userId: string): Promise<{ canBorrow: boolean; pendingTransactions: PendingTransaction[] }> => {
  try {
    // 반납 기한이 지난 진행중인 거래만 확인
    const { data, error } = await supabase
      .from('transactions')
      .select('id, status, book_id')
      .eq('borrower_id', userId)
      .eq('status', 'in_progress')
      .not('return_deadline', 'is', null)
      .lt('return_deadline', new Date().toISOString());

    if (error) {
      console.error('Error checking user borrow eligibility:', error);
      return { canBorrow: true, pendingTransactions: [] }; // Allow borrowing if check fails
    }

    const pendingTransactions = data || [];
    const canBorrow = pendingTransactions.length === 0;

    return { canBorrow, pendingTransactions };
  } catch (error) {
    console.error('Error:', error);
    return { canBorrow: true, pendingTransactions: [] }; // Allow borrowing if check fails
  }
};