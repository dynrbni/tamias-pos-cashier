import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { User, Store, LogOut, ChevronRight, Shield, Bell, HelpCircle } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { signOut, getCurrentEmployee, getStore, getStoreId, Employee } from "../../lib/api";
import { Store as StoreType } from "../../lib/supabase";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#dcfce7",
    background: "#f9fafb",
    surface: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#6b7280",
    white: "#ffffff",
    red: "#ef4444",
    redLight: "#fef2f2",
};

export default function Settings() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [store, setStore] = useState<StoreType | null>(null);

    const loadData = async () => {
        try {
            // Load employee from global
            const emp = getCurrentEmployee();
            setEmployee(emp);

            const storeId = getStoreId();
            if (storeId) {
                const storeData = await getStore(storeId);
                setStore(storeData);
            }
        } catch (err) {
            console.error("Load settings error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            "Keluar",
            "Yakin ingin keluar dari aplikasi?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Keluar",
                    style: "destructive",
                    onPress: () => {
                        setIsLoggingOut(true);
                        signOut();
                        router.replace("/login");
                    }
                }
            ]
        );
    };

    const getRoleLabel = (role: string | undefined) => {
        switch (role) {
            case "owner":
                return "Pemilik";
            case "admin":
                return "Admin";
            case "manager":
                return "Manager";
            default:
                return "Kasir";
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView style={styles.scrollView}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {employee?.name?.substring(0, 2).toUpperCase() || "U"}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{employee?.name || "User"}</Text>
                        <Text style={styles.profileEmail}>ID: {employee?.employee_id || "-"}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>{getRoleLabel(employee?.role)}</Text>
                        </View>
                    </View>
                </View>

                {/* Store Info */}
                {store && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Toko</Text>
                        <View style={styles.card}>
                            <View style={styles.menuItem}>
                                <View style={[styles.menuIcon, { backgroundColor: COLORS.primaryLight }]}>
                                    <Store size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.menuContent}>
                                    <Text style={styles.menuLabel}>{store.name}</Text>
                                    <Text style={styles.menuSubtext}>{store.address || "Alamat belum diatur"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Menu Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pengaturan</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIcon, { backgroundColor: "#dbeafe" }]}>
                                <User size={20} color="#3b82f6" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>Profil Saya</Text>
                            </View>
                            <ChevronRight size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIcon, { backgroundColor: "#fef3c7" }]}>
                                <Bell size={20} color="#f59e0b" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>Notifikasi</Text>
                            </View>
                            <ChevronRight size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIcon, { backgroundColor: "#ede9fe" }]}>
                                <Shield size={20} color="#8b5cf6" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>Keamanan</Text>
                            </View>
                            <ChevronRight size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bantuan</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.menuItem}>
                            <View style={[styles.menuIcon, { backgroundColor: "#e0e7ff" }]}>
                                <HelpCircle size={20} color="#6366f1" />
                            </View>
                            <View style={styles.menuContent}>
                                <Text style={styles.menuLabel}>Pusat Bantuan</Text>
                            </View>
                            <ChevronRight size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? (
                            <ActivityIndicator size="small" color={COLORS.red} />
                        ) : (
                            <>
                                <LogOut size={20} color={COLORS.red} />
                                <Text style={styles.logoutText}>Keluar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appName}>TamiasPOS Cashier</Text>
                    <Text style={styles.appVersion}>Versi 1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scrollView: {
        flex: 1,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        padding: 20,
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.white,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
    },
    profileEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontFamily: "monospace",
    },
    roleBadge: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: COLORS.primary,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: "uppercase",
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    menuContent: {
        flex: 1,
        marginLeft: 12,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.text,
    },
    menuSubtext: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 68,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.redLight,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.red,
    },
    appInfo: {
        alignItems: "center",
        paddingVertical: 32,
    },
    appName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    appVersion: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
});
