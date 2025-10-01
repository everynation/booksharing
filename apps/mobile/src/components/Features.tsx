import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const features = [
  {
    icon: "book-open",
    title: "쉬운 책 등록",
    description: "사진 한 장으로 간단하게 책을 등록하고 이웃과 공유하세요.",
    color: "#f97316",
  },
  {
    icon: "map-pin",
    title: "우리 동네 책방",
    description: "가까운 이웃의 책꽂이에서 읽고 싶은 책을 바로 찾아보세요.",
    color: "#22c55e",
  },
  {
    icon: "heart",
    title: "따뜻한 나눔",
    description: "대여부터 판매까지, 이웃과 함께하는 책 나눔 문화를 만들어가요.",
    color: "#fb923c",
  },
  {
    icon: "clock",
    title: "간편한 거래",
    description: "직접 만나서 간단하게 거래하고, 반납 인증으로 안전하게 마무리하세요.",
    color: "#f97316",
  },
  {
    icon: "shield",
    title: "안전한 시스템",
    description: "사용자 검증과 거래 내역 관리로 믿을 수 있는 책 공유 환경을 제공합니다.",
    color: "#92400e",
  },
  {
    icon: "gift",
    title: "보상 시스템",
    description: "책 대여 수익이 원가를 넘으면 새로운 책을 보상으로 받을 수 있어요.",
    color: "#22c55e",
  },
] as const;

const Features = () => (
  <View style={styles.section}>
    <View style={styles.headerBlock}>
      <Text style={styles.heading}>옆집책꽂이가 특별한 이유</Text>
      <Text style={styles.subheading}>
        단순한 책 대여를 넘어, 이웃과 함께 만들어가는 새로운 독서 문화입니다
      </Text>
    </View>

    <View style={styles.cardGrid}>
      {features.map((feature) => {
        const iconBackgroundColor = `${feature.color}1a`;

        return (
          <View key={feature.title} style={styles.card}>
            <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>
              <Feather name={feature.icon} size={28} color={feature.color} />
            </View>
            <Text style={styles.cardTitle}>{feature.title}</Text>
            <Text style={styles.cardDescription}>{feature.description}</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
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
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  card: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 18,
    padding: 20,
    gap: 12,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  cardDescription: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
});

export default Features;
