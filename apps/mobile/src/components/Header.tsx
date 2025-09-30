import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ROUTES, isProtectedRoute } from "@shared/navigation/routes";
import { useAuth } from "@mobile/hooks/useAuth";
import { RootStackParamList } from "@mobile/navigation/AppNavigator";

const stylesVars = {
  primary: "#f97316",
  text: "#1f2937",
  muted: "#6b7280",
  background: "#ffffff",
  border: "#e5e7eb",
};

const Header = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, signOut, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const goTo = (route: (typeof ROUTES)[keyof typeof ROUTES]) => {
    setIsMenuOpen(false);

    if (isProtectedRoute(route) && !user) {
      navigation.navigate(ROUTES.AUTH);
      return;
    }

    navigation.navigate(route);
  };

  const handleAuthAction = async () => {
    if (!user) {
      goTo(ROUTES.AUTH);
      return;
    }

    await signOut();
    navigation.navigate(ROUTES.HOME);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerRow}>
        <TouchableOpacity
          style={styles.logoRow}
          onPress={() => goTo(ROUTES.HOME)}
          accessibilityRole="button"
          accessibilityLabel="홈으로 이동"
        >
          <Feather name="book" size={28} color={stylesVars.primary} />
          <Text style={styles.logoText}>옆집책꽂이</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => goTo(ROUTES.BOOKS)}
            accessibilityRole="button"
          >
            <Feather name="search" size={18} color={stylesVars.text} />
            <Text style={styles.iconButtonLabel}>검색</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, styles.primaryButton]}
            onPress={() => goTo(ROUTES.ADD_BOOK)}
            accessibilityRole="button"
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={[styles.iconButtonLabel, styles.primaryButtonLabel]}>책 등록</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setIsMenuOpen((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="메뉴 열기"
          >
            <Feather name={isMenuOpen ? "x" : "menu"} size={22} color={stylesVars.text} />
          </TouchableOpacity>
        </View>
      </View>

      {isMenuOpen && (
        <View style={styles.mobileMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo(ROUTES.BOOKS)}>
            <Text style={styles.menuItemText}>책 찾기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => goTo(ROUTES.MY_LIBRARY)}>
            <Text style={styles.menuItemText}>내 책장</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleAuthAction} disabled={loading}>
            <Text style={styles.menuItemText}>{user ? "로그아웃" : "로그인"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: stylesVars.background,
    borderBottomWidth: 1,
    borderBottomColor: stylesVars.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  innerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "700",
    color: stylesVars.text,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: stylesVars.border,
    backgroundColor: "#f9fafb",
  },
  iconButtonLabel: {
    fontSize: 14,
    color: stylesVars.text,
  },
  primaryButton: {
    backgroundColor: stylesVars.primary,
    borderColor: stylesVars.primary,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
  menuButton: {
    marginLeft: 8,
    padding: 8,
  },
  mobileMenu: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: stylesVars.border,
    paddingTop: 12,
    gap: 10,
  },
  menuItem: {
    paddingVertical: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: stylesVars.text,
  },
});

export default Header;
