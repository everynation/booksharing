import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const steps = [
  {
    icon: "plus",
    title: "책 등록하기",
    description: "가지고 있는 책을 사진과 함께 등록하고 대여 또는 판매 가격을 설정하세요.",
    step: "01",
  },
  {
    icon: "search",
    title: "책 찾기",
    description: "옆집 이웃들이 공유한 책 중에서 읽고 싶은 책을 검색하고 찾아보세요.",
    step: "02",
  },
  {
    icon: "handshake",
    title: "거래하기",
    description: "원하는 책에 대여 또는 구매 요청을 하고 직접 만나서 거래하세요.",
    step: "03",
  },
  {
    icon: "check-circle",
    title: "반납 인증",
    description: "책을 다 읽은 후 반납하면 책 주인이 사진으로 반납을 인증해드립니다.",
    step: "04",
  },
] as const;

const HowItWorks = () => (
  <View style={styles.section}>
    <View style={styles.headerBlock}>
      <Text style={styles.heading}>어떻게 이용하나요?</Text>
      <Text style={styles.subheading}>간단한 4단계로 옆집 이웃과 책을 나누어보세요</Text>
    </View>

    <View style={styles.stepGrid}>
      {steps.map((step) => (
        <View key={step.step} style={styles.stepCard}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{step.step}</Text>
          </View>
          <View style={styles.iconWrapper}>
            <Feather name={step.icon} size={28} color="#f97316" />
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>
      ))}
    </View>

    <View style={styles.ctaContainer}>
      <Text style={styles.ctaHeading}>지금 바로 시작해보세요!</Text>
      <Text style={styles.ctaBody}>첫 번째 책을 등록하고 옆집 이웃과 함께하는 독서 여행을 시작하세요</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
    gap: 28,
  },
  headerBlock: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
  stepGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  stepCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  stepBadge: {
    position: "absolute",
    top: -18,
    backgroundColor: "#f97316",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stepBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  iconWrapper: {
    marginTop: 16,
    backgroundColor: "#fff7ed",
    borderRadius: 32,
    padding: 14,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    textAlign: "center",
  },
  ctaContainer: {
    backgroundColor: "#fff7ed",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  ctaHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },
  ctaBody: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default HowItWorks;
