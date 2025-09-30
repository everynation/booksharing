import { ScrollView, StyleSheet, View } from "react-native";
import CallToAction from "../components/CallToAction";
import Features from "../components/Features";
import Footer from "../components/Footer";
import Header from "../components/Header";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";

const HomeScreen = () => (
  <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <View style={styles.ctaWrapper}>
        <CallToAction />
      </View>
      <Footer />
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  container: {
    paddingBottom: 40,
    backgroundColor: "#ffffff",
  },
  ctaWrapper: {
    paddingHorizontal: 20,
  },
});

export default HomeScreen;
