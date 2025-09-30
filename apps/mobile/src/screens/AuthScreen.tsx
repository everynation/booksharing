import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@mobile/lib/supabase";
import { useAuth } from "@mobile/hooks/useAuth";
import { ROUTES } from "@shared/navigation/routes";
import type { RootStackParamList } from "@mobile/navigation/AppNavigator";

const AuthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("입력 필요", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        Alert.alert("환영합니다", "성공적으로 로그인했어요.");
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        Alert.alert(
          "가입 완료",
          "회원가입이 완료되었습니다. 이메일을 확인하고 다시 로그인해주세요."
        );
        setMode("signin");
      }

      setEmail("");
      setPassword("");
      navigation.replace(ROUTES.HOME);
    } catch (error) {
      console.warn("🔐 auth error", error);
      Alert.alert("오류", error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.welcome}>이미 로그인되어 있습니다.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace(ROUTES.HOME)}>
          <Text style={styles.primaryButtonLabel}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.card}>
        <Text style={styles.heading}>옆집책꽂이</Text>
        <Text style={styles.subheading}>
          {mode === "signin" ? "로그인하고 책을 탐색해보세요." : "간단하게 가입하고 시작해보세요."}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@email.com"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="8자 이상 비밀번호"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAuth}
          />
        </View>

        <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonLabel}>{mode === "signin" ? "로그인" : "회원가입"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === "signin" ? "signup" : "signin")} style={styles.toggleButton}>
          <Text style={styles.toggleText}>
            {mode === "signin" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있나요? 로그인"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: "rgba(15, 23, 42, 0.12)",
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  subheading: {
    fontSize: 15,
    color: "#64748b",
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  primaryButton: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  toggleButton: {
    alignItems: "center",
    marginTop: 4,
  },
  toggleText: {
    color: "#fb923c",
    fontSize: 14,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  welcome: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
});

export default AuthScreen;
