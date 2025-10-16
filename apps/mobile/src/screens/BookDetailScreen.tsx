import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@mobile/lib/supabase";
import { useAuth } from "@mobile/hooks/useAuth";
import { RootStackParamList } from "@mobile/navigation/AppNavigator";

type BookDetailRouteProp = RouteProp<RootStackParamList, "BookDetail">;

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_image_url: string;
  price: number;
  transaction_type: string;
  user_id: string;
  status: string;
}

const BookDetailScreen = () => {
  const route = useRoute<BookDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { bookId } = route.params;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error("책 정보 로드 실패:", error);
      Alert.alert("오류", "책 정보를 불러올 수 없습니다.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTransaction = async () => {
    if (!user) {
      Alert.alert("로그인 필요", "거래를 요청하려면 로그인이 필요합니다.");
      return;
    }

    if (!book) return;

    setRequesting(true);

    try {
      const { error } = await supabase.from("transactions").insert({
        book_id: book.id,
        borrower_id: user.id,
        owner_id: book.user_id,
        type: book.transaction_type,
        status: "requested",
        total_amount: book.price,
      });

      if (error) throw error;

      Alert.alert("성공", "거래 요청이 전송되었습니다!");
      navigation.goBack();
    } catch (error) {
      console.error("거래 요청 실패:", error);
      Alert.alert("오류", "거래 요청에 실패했습니다.");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>책을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isOwner = user?.id === book.user_id;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {book.cover_image_url && (
          <Image
            source={{ uri: book.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>저자: {book.author}</Text>

          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                book.transaction_type === "sale"
                  ? styles.saleBadge
                  : styles.rentalBadge,
              ]}
            >
              <Text style={styles.badgeText}>
                {book.transaction_type === "sale" ? "판매" : "대여"}
              </Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{book.price.toLocaleString()}원</Text>
            </View>
          </View>

          {book.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>설명</Text>
              <Text style={styles.description}>{book.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래 정보</Text>
            <View style={styles.infoRow}>
              <Feather name="tag" size={16} color="#64748b" />
              <Text style={styles.infoText}>
                상태: {book.status === "available" ? "거래 가능" : "거래 중"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {!isOwner && book.status === "available" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.requestButton, requesting && styles.requestButtonDisabled]}
            onPress={handleRequestTransaction}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="shopping-cart" size={20} color="#fff" />
                <Text style={styles.requestButtonText}>
                  {book.transaction_type === "sale" ? "구매 요청" : "대여 요청"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.footer}>
          <Text style={styles.ownerText}>내가 등록한 책입니다</Text>
        </View>
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
  },
  scrollContent: {
    paddingBottom: 100,
  },
  coverImage: {
    width: "100%",
    height: 400,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  saleBadge: {
    backgroundColor: "#dbeafe",
  },
  rentalBadge: {
    backgroundColor: "#fef3c7",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#dcfce7",
    borderRadius: 999,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16a34a",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  requestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f97316",
    borderRadius: 12,
    padding: 16,
  },
  requestButtonDisabled: {
    opacity: 0.7,
  },
  requestButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  ownerText: {
    textAlign: "center",
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
  },
});

export default BookDetailScreen;
