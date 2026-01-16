import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { User, Store, Bell, Printer, LogOut, ChevronRight, Moon } from "lucide-react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

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
    const [notifications, setNotifications] = useState(true);
    const [autoPrint, setAutoPrint] = useState(false);

    const handleLogout = () => {
        router.replace("/login");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pengaturan</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>KU</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Kasir Utama</Text>
                        <Text style={styles.profileRole}>kasir@tamias.com</Text>
                    </View>
                    <ChevronRight size={20} color={COLORS.textSecondary} />
                </View>

                {/* Settings Groups */}
                <Text style={styles.sectionLabel}>Toko</Text>
                <View style={styles.settingsGroup}>
                    <TouchableOpacity style={[styles.settingItem, styles.settingBorder]}>
                        <View style={[styles.settingIcon, { backgroundColor: COLORS.primaryLight }]}>
                            <Store size={20} color={COLORS.primary} />
                        </View>
                        <Text style={styles.settingLabel}>Informasi Toko</Text>
                        <ChevronRight size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <View style={[styles.settingIcon, { backgroundColor: "#dbeafe" }]}>
                            <Printer size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.settingLabel}>Printer</Text>
                        <ChevronRight size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionLabel}>Preferensi</Text>
                <View style={styles.settingsGroup}>
                    <View style={[styles.settingItem, styles.settingBorder]}>
                        <View style={[styles.settingIcon, { backgroundColor: "#fef3c7" }]}>
                            <Bell size={20} color="#f59e0b" />
                        </View>
                        <Text style={[styles.settingLabel, { flex: 1 }]}>Notifikasi</Text>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={notifications ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>

                    <View style={styles.settingItem}>
                        <View style={[styles.settingIcon, { backgroundColor: "#ede9fe" }]}>
                            <Printer size={20} color="#8b5cf6" />
                        </View>
                        <Text style={[styles.settingLabel, { flex: 1 }]}>Auto Print Struk</Text>
                        <Switch
                            value={autoPrint}
                            onValueChange={setAutoPrint}
                            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                            thumbColor={autoPrint ? COLORS.primary : COLORS.textSecondary}
                        />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <View style={[styles.settingIcon, { backgroundColor: COLORS.redLight }]}>
                        <LogOut size={20} color={COLORS.red} />
                    </View>
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>

                <Text style={styles.version}>TamiasPOS Cashier v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.text,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    avatar: {
        width: 56,
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.white,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    profileRole: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    settingsGroup: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 24,
        overflow: "hidden",
    },
    settingItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    settingBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.red,
        marginLeft: 12,
    },
    version: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: 32,
    },
});
