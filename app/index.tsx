import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { getCurrentEmployee } from "../lib/api";

export default function Index() {
    // Check if employee is logged in (from global)
    const employee = getCurrentEmployee();

    // No loading needed - it's synchronous
    if (employee) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
});
