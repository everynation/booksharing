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
import { Feather } from "@expo/vector-icons";
import { supabase } from "@mobile/lib/supabase";
import { useAuth } from "@mobile/hooks/useAuth";

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  transaction_type: string | null;
  price: number | null;
}

const BooksScreen = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, transaction_type, price")
      .limit(25);

    if (error) {
      console.warn("📚 책 목록 로드 실패", error);
      setBooks([]);
    } else {
      setBooks(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>책 둘러보기</Text>
        {user && (
          <Text style={styles.subtitle}>안녕하세요, {user.email ?? "회원"}님!</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loaderText}>책 목록을 불러오는 중...</Text>
        </View>
      ) : books.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="book" size={48} color="#cbd5f5" />
          <Text style={styles.emptyTitle}>아직 등록된 책이 없어요</Text>
          <Text style={styles.emptyDescription}>첫 번째 책을 등록해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.bookCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                {item.transaction_type && (
                  <Text style={styles.badge}>{item.transaction_type === "sale" ? "판매" : "대여"}</Text>
                )}
              </View>
              {item.author && <Text style={styles.bookAuthor}>{item.author}</Text>}
              {item.price !== null && (
                <Text style={styles.bookPrice}>{item.price.toLocaleString()}원</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    gap: 4,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loaderText: {
    color: "#64748b",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  emptyDescription: {
    color: "#64748b",
  },
  listContent: {
    paddingBottom: 40,
    gap: 14,
  },
  bookCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  badge: {
    backgroundColor: "#fde68a",
    color: "#92400e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
  },
  bookAuthor: {
    fontSize: 14,
    color: "#475569",
  },
  bookPrice: {
    fontSize: 15,
    color: "#16a34a",
    fontWeight: "600",
  },
});

export default BooksScreen;
