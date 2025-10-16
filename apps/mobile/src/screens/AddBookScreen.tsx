import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@mobile/lib/supabase";
import { useAuth } from "@mobile/hooks/useAuth";

const AddBookScreen = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  // Form state
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [transactionType, setTransactionType] = useState<"sale" | "rental">("sale");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setIsbn(data);
    setScanning(false);
    searchBookByISBN(data);
  };

  const searchBookByISBN = async (isbnCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("search-book", {
        body: { isbn: isbnCode },
      });

      if (error) throw error;

      if (data?.title) {
        setTitle(data.title);
        setAuthor(data.author || "");
        setDescription(data.description || "");
        if (data.coverImageUrl) {
          setCoverImage(data.coverImageUrl);
        }
      }
    } catch (error) {
      console.error("ISBN 검색 실패:", error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "위치 권한이 필요합니다.");
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      Alert.alert("성공", "현재 위치가 설정되었습니다.");
    } catch (error) {
      Alert.alert("오류", "위치를 가져올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("로그인 필요", "책을 등록하려면 로그인이 필요합니다.");
      return;
    }

    if (!title || !author || !price) {
      Alert.alert("입력 필요", "제목, 저자, 가격은 필수 항목입니다.");
      return;
    }

    setLoading(true);

    try {
      let coverImageUrl = coverImage;

      // Upload cover image if it's a local file
      if (coverImage && coverImage.startsWith("file://")) {
        const response = await fetch(coverImage);
        const blob = await response.blob();
        const fileName = `${Date.now()}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("book-covers")
          .upload(fileName, blob);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("book-covers")
          .getPublicUrl(fileName);

        coverImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("books").insert({
        user_id: user.id,
        isbn,
        title,
        author,
        description,
        price: parseInt(price),
        transaction_type: transactionType,
        cover_image_url: coverImageUrl,
        latitude,
        longitude,
        for_sale: transactionType === "sale",
        for_rental: transactionType === "rental",
        status: "available",
      });

      if (error) throw error;

      Alert.alert("성공", "책이 등록되었습니다!");
      
      // Reset form
      setIsbn("");
      setTitle("");
      setAuthor("");
      setDescription("");
      setPrice("");
      setCoverImage(null);
      setLatitude(null);
      setLongitude(null);
    } catch (error) {
      console.error("책 등록 실패:", error);
      Alert.alert("오류", "책 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (scanning) {
    if (!permission) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>권한 허용</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "code128", "code39"],
          }}
          onBarcodeScanned={handleBarCodeScanned}
        />
        <TouchableOpacity
          style={styles.closeScannerButton}
          onPress={() => setScanning(false)}
        >
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>책 등록</Text>

        {/* ISBN Scanner */}
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
          <Feather name="camera" size={20} color="#f97316" />
          <Text style={styles.scanButtonText}>바코드 스캔</Text>
        </TouchableOpacity>

        {/* ISBN Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ISBN</Text>
          <TextInput
            value={isbn}
            onChangeText={setIsbn}
            placeholder="ISBN 번호"
            style={styles.input}
          />
        </View>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="책 제목"
            style={styles.input}
          />
        </View>

        {/* Author */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>저자 *</Text>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="저자명"
            style={styles.input}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="책 설명"
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Transaction Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>거래 유형 *</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setTransactionType("sale")}
            >
              <View
                style={[
                  styles.radio,
                  transactionType === "sale" && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioLabel}>판매</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radioButton}
              onPress={() => setTransactionType("rental")}
            >
              <View
                style={[
                  styles.radio,
                  transactionType === "rental" && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioLabel}>대여</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>가격 *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="가격 (원)"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        {/* Cover Image */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>표지 이미지</Text>
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Feather name="image" size={20} color="#f97316" />
            <Text style={styles.imageButtonText}>이미지 선택</Text>
          </TouchableOpacity>
          {coverImage && (
            <Image source={{ uri: coverImage }} style={styles.preview} />
          )}
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>위치</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={getCurrentLocation}
          >
            <Feather name="map-pin" size={20} color="#f97316" />
            <Text style={styles.locationButtonText}>
              {latitude && longitude ? "위치 설정됨" : "현재 위치 설정"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 24,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  scanButtonText: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  radioGroup: {
    flexDirection: "row",
    gap: 20,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  radioSelected: {
    borderColor: "#f97316",
    backgroundColor: "#f97316",
  },
  radioLabel: {
    fontSize: 16,
    color: "#475569",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  imageButtonText: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 16,
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  locationButtonText: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#f97316",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeScannerButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 24,
    padding: 12,
  },
  permissionText: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default AddBookScreen;
