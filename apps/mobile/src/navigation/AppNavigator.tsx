import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@mobile/screens/HomeScreen";
import BooksScreen from "@mobile/screens/BooksScreen";
import AddBookScreen from "@mobile/screens/AddBookScreen";
import AuthScreen from "@mobile/screens/AuthScreen";
import MyLibraryScreen from "@mobile/screens/MyLibraryScreen";
import BookDetailScreen from "@mobile/screens/BookDetailScreen";
import TransactionsScreen from "@mobile/screens/TransactionsScreen";
import { ROUTES } from "@shared/navigation/routes";

export type RootStackParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.BOOKS]: undefined;
  [ROUTES.ADD_BOOK]: undefined;
  [ROUTES.AUTH]: undefined;
  [ROUTES.MY_LIBRARY]: undefined;
  BookDetail: { bookId: string };
  Transactions: undefined;
  TransactionDetail: { transactionId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName={ROUTES.HOME}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.BOOKS} component={BooksScreen} />
      <Stack.Screen name={ROUTES.ADD_BOOK} component={AddBookScreen} />
      <Stack.Screen name={ROUTES.AUTH} component={AuthScreen} />
      <Stack.Screen name={ROUTES.MY_LIBRARY} component={MyLibraryScreen} />
      <Stack.Screen 
        name="BookDetail" 
        component={BookDetailScreen}
        options={{ title: "책 상세" }}
      />
      <Stack.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{ title: "거래 내역" }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
