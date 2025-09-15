import { supabase } from "@/integrations/supabase/client";

export interface PendingTransaction {
  id: string;
  status: string;
  book_id: string;
}

export const checkUserCanBorrow = async (userId: string): Promise<{ canBorrow: boolean; pendingTransactions: PendingTransaction[] }> => {
  try {
    // 최근 30일 이내의 거래만 확인 (오래된 거래 제외)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('transactions')
      .select('id, status, book_id')
      .eq('borrower_id', userId)
      .in('status', ['requested', 'in_progress'])
      .gte('created_at', thirtyDaysAgo.toISOString());

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