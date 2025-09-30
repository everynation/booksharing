import { StyleSheet, Text, View } from "react-native";

const MyLibraryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>내 책장</Text>
    <Text style={styles.description}>보유한 책과 거래 내역을 보여주는 화면을 구성할 예정입니다.</Text>
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

export default MyLibraryScreen;
