import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#22c55e",
    primaryDark: "#15803d",
    background: "#ffffff",
    surface: "#f9fafb",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#6b7280",
    white: "#ffffff",
    red: "#ef4444",
};

export default function Login() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!employeeId.trim()) {
            setError("ID Karyawan wajib diisi");
            return;
        }
        if (!password) {
            setError("Password wajib diisi");
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            // Find employee by employee_id
            const { data: employee, error: empError } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', employeeId.trim())
                .single();

            if (empError || !employee) {
                setError("ID Karyawan tidak ditemukan");
                setIsLoading(false);
                return;
            }

            // Check if employee is active
            if (!employee.is_active) {
                setError("Akun Anda tidak aktif. Hubungi owner.");
                setIsLoading(false);
                return;
            }

            // Verify password (stored in 'pin' field)
            if (employee.pin !== password) {
                setError("Password salah");
                setIsLoading(false);
                return;
            }

            // Store employee data in AsyncStorage or context for later use
            // For now, we'll use a simple approach - store in global
            (global as any).currentEmployee = employee;
            (global as any).currentStoreId = employee.store_id;

            // Navigate to main app
            router.replace("/(tabs)");
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Login gagal. Coba lagi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.content}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>T</Text>
                    </View>
                    <Text style={styles.brandName}>
                        Tamias<Text style={styles.brandAccent}>POS</Text>
                    </Text>
                    <Text style={styles.tagline}>Aplikasi Kasir</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ID Karyawan</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan 10 digit ID"
                            placeholderTextColor={COLORS.textSecondary}
                            value={employeeId}
                            onChangeText={(text) => {
                                // Only allow numbers
                                const numericText = text.replace(/[^0-9]/g, '');
                                setEmployeeId(numericText);
                                setError("");
                            }}
                            keyboardType="number-pad"
                            maxLength={10}
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.textSecondary}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setError("");
                            }}
                            secureTextEntry
                            editable={!isLoading}
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.loginButtonText}>Masuk</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Minta ID & password ke owner/admin toko Anda
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: "center",
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 48,
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 40,
        fontWeight: "bold",
        color: COLORS.white,
    },
    brandName: {
        fontSize: 32,
        fontWeight: "bold",
        color: COLORS.text,
    },
    brandAccent: {
        color: COLORS.primary,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
    },
    errorBox: {
        backgroundColor: "#fef2f2",
        borderWidth: 1,
        borderColor: "#fecaca",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    errorText: {
        color: COLORS.red,
        fontSize: 14,
        textAlign: "center",
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: "bold",
    },
    footer: {
        alignItems: "center",
        marginTop: 32,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        textAlign: "center",
    },
});
