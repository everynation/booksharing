import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ROUTES, isProtectedRoute } from "@shared/navigation/routes";
import { useAuth } from "@mobile/hooks/useAuth";
import { RootStackParamList } from "@mobile/navigation/AppNavigator";

const CallToAction = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const handleNavigate = (route: (typeof ROUTES)[keyof typeof ROUTES]) => {
    if (isProtectedRoute(route) && !user) {
      navigation.navigate(ROUTES.AUTH);
      return;
    }
    navigation.navigate(route);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>옆집 이웃과 함께 시작해보세요!</Text>
      <Text style={styles.body}>
        가까운 이웃과 함께 만들어가는 따뜻한 독서 문화,{"\n"}
        옆집책꽂이에서 새로운 책과 새로운 이웃을 만나보세요.
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNavigate(ROUTES.BOOKS)}
        >
          <Feather name="book-open" size={18} color="#f97316" />
          <Text style={styles.primaryLabel}>책 둘러보기</Text>
          <Feather name="arrow-right" size={18} color="#f97316" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigate(ROUTES.ADD_BOOK)}>
          <Feather name="plus" size={18} color="#f97316" />
          <Text style={styles.primaryLabel}>첫 번째 책 등록</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subnote}>🏠 우리 동네부터 시작하는 책 나눔 문화</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#f97316",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    gap: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    color: "#fff7ed",
    textAlign: "center",
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryLabel: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 16,
  },
  subnote: {
    fontSize: 14,
    color: "#ffe4d6",
  },
});

export default CallToAction;
