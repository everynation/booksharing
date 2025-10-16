import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@mobile/lib/supabase";
import { useAuth } from "@mobile/hooks/useAuth";
import { RootStackParamList } from "@mobile/navigation/AppNavigator";

interface Transaction {
  id: string;
  book_id: string;
  status: string;
  type: string;
  total_amount: number;
  created_at: string;
  books: {
    title: string;
    author: string;
  };
}

const TransactionsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          book_id,
          status,
          type,
          total_amount,
          created_at,
          books (
            title,
            author
          )
        `)
        .or(`borrower_id.eq.${user.id},owner_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("거래 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      requested: "요청됨",
      approved: "승인됨",
      active: "진행 중",
      completed: "완료",
      cancelled: "취소됨",
      pending_return: "반납 대기",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      requested: "#fbbf24",
      approved: "#3b82f6",
      active: "#10b981",
      completed: "#6b7280",
      cancelled: "#ef4444",
      pending_return: "#8b5cf6",
    };
    return colorMap[status] || "#6b7280";
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() => navigation.navigate("TransactionDetail", { transactionId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.bookTitle}>{item.books.title}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.author}>{item.books.author}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.typeContainer}>
          <Feather
            name={item.type === "sale" ? "shopping-bag" : "clock"}
            size={14}
            color="#64748b"
          />
          <Text style={styles.typeText}>
            {item.type === "sale" ? "판매" : "대여"}
          </Text>
        </View>
        <Text style={styles.amount}>{item.total_amount.toLocaleString()}원</Text>
      </View>

      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString("ko-KR")}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>거래 내역을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>거래 내역</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>거래 내역이 없습니다</Text>
          <Text style={styles.emptyDescription}>
            책을 구매하거나 대여해보세요!
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  transactionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  bookTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  author: {
    fontSize: 14,
    color: "#64748b",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    color: "#64748b",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },
  date: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748b",
  },
});

export default TransactionsScreen;
