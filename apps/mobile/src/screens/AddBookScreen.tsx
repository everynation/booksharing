import { StyleSheet, Text, View } from "react-native";

const AddBookScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>책 등록</Text>
    <Text style={styles.description}>책 정보를 입력하고 업로드하는 화면을 구성할 예정입니다.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  description: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 22,
  },
});

export default AddBookScreen;
