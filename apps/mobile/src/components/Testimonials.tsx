import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const testimonials = [
  {
    name: "김지혜",
    role: "워킹맘 · 성수동",
    content:
      "아이들 책을 옆집과 공유하니까 경제적이고, 아이도 더 다양한 책을 읽게 되어서 좋아요. 옆집 아주머니와도 자연스럽게 친해졌어요!",
  },
  {
    name: "박민수",
    role: "직장인 · 강남구",
    content:
      "퇴근 후에도 간편하게 책을 빌릴 수 있어서 정말 편해요. 같은 책을 읽은 이웃분들과 독서 모임도 하게 되었습니다.",
  },
  {
    name: "이수진",
    role: "대학생 · 홍대",
    content: "전공서적이 너무 비싸서 고민이었는데, 옆집책꽂이로 선배들 책을 빌려서 공부할 수 있어서 정말 감사해요. 돈도 벌고 책도 읽고!",
  },
] as const;

const Testimonials = () => (
  <View style={styles.section}>
    <View style={styles.headerBlock}>
      <Text style={styles.heading}>옆집 이웃들의 이야기</Text>
      <Text style={styles.subheading}>
        옆집책꽂이를 통해 더 풍부한 독서 생활을 경험하고 있는 이웃들의 진짜 후기입니다
      </Text>
    </View>

    <View style={styles.cardGrid}>
      {testimonials.map((testimonial) => (
        <View key={testimonial.name} style={styles.card}>
          <Feather name="quote" size={26} color="#f97316" />
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Feather key={index} name="star" size={16} color="#f97316" />
            ))}
          </View>
          <Text style={styles.content}>“{testimonial.content}”</Text>
          <View style={styles.footerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{testimonial.name[0]}</Text>
            </View>
            <View>
              <Text style={styles.name}>{testimonial.name}</Text>
              <Text style={styles.role}>{testimonial.role}</Text>
            </View>
          </View>
        </View>
      ))}
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
  },
  card: {
    width: "100%",
    backgroundColor: "#f9fafb",
    borderRadius: 18,
    padding: 20,
    gap: 12,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 6,
  },
  content: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  role: {
    fontSize: 14,
    color: "#64748b",
  },
});

export default Testimonials;
