import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const Footer = () => (
  <View style={styles.footer}>
    <View style={styles.grid}>
      <View style={styles.column}>
        <View style={styles.logoRow}>
          <Feather name="book" size={24} color="#fb923c" />
          <Text style={styles.logoText}>옆집책꽂이</Text>
        </View>
        <Text style={styles.description}>이웃과 책을 나누는{"\n"}따뜻한 공유 도서관</Text>
        <View style={styles.socialRow}>
          <Feather name="instagram" size={18} color="#f8fafc" />
          <Feather name="facebook" size={18} color="#f8fafc" />
          <Feather name="twitter" size={18} color="#f8fafc" />
        </View>
      </View>

      <View style={styles.column}>
        <Text style={styles.columnTitle}>서비스</Text>
        <Text style={styles.link}>책 찾기</Text>
        <Text style={styles.link}>책 등록</Text>
        <Text style={styles.link}>독후감</Text>
        <Text style={styles.link}>내 책장</Text>
      </View>

      <View style={styles.column}>
        <Text style={styles.columnTitle}>고객지원</Text>
        <Text style={styles.link}>자주 묻는 질문</Text>
        <Text style={styles.link}>이용 가이드</Text>
        <Text style={styles.link}>문의하기</Text>
        <Text style={styles.link}>안전 가이드</Text>
      </View>

      <View style={styles.column}>
        <Text style={styles.columnTitle}>회사</Text>
        <Text style={styles.link}>회사 소개</Text>
        <Text style={styles.link}>이용약관</Text>
        <Text style={styles.link}>개인정보처리방침</Text>
        <Text style={styles.link}>채용</Text>
      </View>
    </View>

    <Text style={styles.copyright}>© 옆집책꽂이. 모든 권리 보유.</Text>
  </View>
);

const styles = StyleSheet.create({
  footer: {
    backgroundColor: "#4b2e2d",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 28,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  column: {
    width: "100%",
    gap: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f8fafc",
  },
  description: {
    color: "#e2e8f0",
    lineHeight: 20,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  columnTitle: {
    fontWeight: "600",
    color: "#f8fafc",
    fontSize: 16,
  },
  link: {
    color: "#e2e8f0",
    fontSize: 14,
  },
  copyright: {
    color: "#cbd5f5",
    textAlign: "center",
    fontSize: 12,
  },
});

export default Footer;
