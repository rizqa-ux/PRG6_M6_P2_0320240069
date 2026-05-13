import React, { useContext } from "react";
import { Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { AuthProvider, AuthContext } from "./context/AuthContext";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import HistoryScreen from "./pages/HistoryScreen";
import DetailScreen from "./pages/DetailScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ================= HISTORY STACK =================
function HistoryStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HistoryList"
                component={HistoryScreen}
                options={{ title: "Riwayat Absensi" }}
            />
            <Stack.Screen
                name="Detail"
                component={DetailScreen}
                options={{ title: "Detail Informasi" }}
            />
        </Stack.Navigator>
    );
}

// ================= TAB =================
function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: "#0056A0",
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: "Beranda",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="home" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={HistoryStack}
                options={{
                    tabBarLabel: "Riwayat",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="history" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

// ================= AUTH STACK =================
function AuthStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}

// ================= MAIN APP =================
function MainApp() {
    const { userData, loading } = useContext(AuthContext);

    if (loading) return <Text>Loading...</Text>;

    return (
        <NavigationContainer>
            {userData ? <AppTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}

// ================= ROOT =================
export default function App() {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
}