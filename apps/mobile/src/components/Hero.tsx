import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ROUTES, isProtectedRoute } from "@shared/navigation/routes";
import { useAuth } from "@mobile/hooks/useAuth";
import { RootStackParamList } from "@mobile/navigation/AppNavigator";

const Hero = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const navigateOrRequireAuth = (route: (typeof ROUTES)[keyof typeof ROUTES]) => {
    if (isProtectedRoute(route) && !user) {
      navigation.navigate(ROUTES.AUTH);
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View style={styles.section}>
      <View style={styles.contentRow}>
        <View style={styles.leftColumn}>
          <Text style={styles.title}>
            <Text style={styles.titleMuted}>옆집의 </Text>
            <Text style={styles.titleHighlight}>책꽂이{"\n"}</Text>
            <Text style={styles.titleMuted}>공유하세요</Text>
          </Text>

          <Text style={styles.description}>
            가까운 이웃과 책을 나누고, 새로운 이야기를 발견하세요. 간단한 대여부터 판매까지, 우리 동네만의 특별한 도서관을 만들어보세요.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.ctaButton, styles.primaryButton]}
              onPress={() => navigateOrRequireAuth(ROUTES.BOOKS)}
            >
              <Feather name="book-open" size={18} color="#fff" />
              <Text style={styles.primaryLabel}>책 둘러보기</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaButton} onPress={() => navigateOrRequireAuth(ROUTES.ADD_BOOK)}>
              <Text style={styles.secondaryLabel}>+ 첫번째 책 등록</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>공유된 책</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>100+</Text>
              <Text style={styles.statLabel}>활성 이웃</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>50+</Text>
              <Text style={styles.statLabel}>완료된 거래</Text>
            </View>
          </View>
        </View>

        <View style={styles.visualColumn}>
          <View style={styles.visualCardGrid}>
            <View style={styles.visualCardColumn}>
              <View style={[styles.mockCard, { backgroundColor: "#60a5fa" }]} />
              <View style={[styles.mockCard, { backgroundColor: "#10b981" }]} />
            </View>
            <View style={[styles.visualCardColumn, styles.visualCardColumnOffset]}>
              <View style={[styles.mockCard, { backgroundColor: "#a855f7" }]} />
              <View style={[styles.mockCard, { backgroundColor: "#fb923c" }]} />
            </View>
          </View>

          <View style={styles.floatingIconOne}>
            <Feather name="users" size={20} color="#fff" />
          </View>
          <View style={styles.floatingIconTwo}>
            <Feather name="book-open" size={20} color="#fff" />
          </View>
        </View>
      </View>
    </View>
  );
};

const stylesVars = {
  background: "#ffffff",
  card: "#f9fafb",
  primary: "#f97316",
  accent: "#22c55e",
  text: "#111827",
  muted: "#6b7280",
  shadow: "rgba(15, 23, 42, 0.08)",
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: stylesVars.background,
  },
  contentRow: {
    flexDirection: "column",
    gap: 32,
  },
  leftColumn: {
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: stylesVars.text,
    lineHeight: 44,
  },
  titleMuted: {
    color: stylesVars.text,
  },
  titleHighlight: {
    color: stylesVars.primary,
  },
  description: {
    fontSize: 16,
    color: stylesVars.muted,
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: stylesVars.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: stylesVars.primary,
  },
  primaryLabel: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryLabel: {
    color: stylesVars.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    backgroundColor: stylesVars.card,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: stylesVars.shadow,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: stylesVars.primary,
  },
  statLabel: {
    fontSize: 13,
    color: stylesVars.muted,
  },
  visualColumn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  visualCardGrid: {
    flexDirection: "row",
    gap: 12,
  },
  visualCardColumn: {
    gap: 12,
  },
  visualCardColumnOffset: {
    marginTop: 32,
  },
  mockCard: {
    width: 140,
    height: 120,
    borderRadius: 16,
    shadowColor: stylesVars.shadow,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  floatingIconOne: {
    position: "absolute",
    top: -16,
    right: 16,
    backgroundColor: stylesVars.primary,
    padding: 10,
    borderRadius: 24,
  },
  floatingIconTwo: {
    position: "absolute",
    bottom: -12,
    left: 24,
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 24,
  },
});

export default Hero;
