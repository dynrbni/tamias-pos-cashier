import { Tabs, useRouter, useSegments } from "expo-router";
import { Home, ShoppingCart, Clock, Settings, LogOut, Menu, X, Package } from "lucide-react-native";
import { Platform, StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, Modal } from "react-native";
import { useState } from "react";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#dcfce7",
    background: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#64748b",
    white: "#ffffff",
    red: "#ef4444",
};

const navItems = [
    { name: "index", label: "Dashboard", icon: Home },
    { name: "pos", label: "Kasir", icon: ShoppingCart },
    { name: "products", label: "Produk", icon: Package },
    { name: "history", label: "Riwayat", icon: Clock },
    { name: "settings", label: "Pengaturan", icon: Settings },
];

export default function TabLayout() {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isLandscape = width > height;
    const router = useRouter();
    const segments = useSegments();
    const [menuOpen, setMenuOpen] = useState(false);

    const currentRoute = segments[segments.length - 1] || "index";

    const handleNavigation = (name: string) => {
        setMenuOpen(false);
        if (name === "index") {
            router.push("/(tabs)/");
        } else {
            router.push(`/(tabs)/${name}` as any);
        }
    };

    // Tablet landscape: Show header bar with burger
    if (isTablet && isLandscape) {
        return (
            <View style={styles.container}>
                {/* Top Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        style={styles.burgerButton}
                        onPress={() => setMenuOpen(true)}
                    >
                        <Menu size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerLogo}>
                        <View style={styles.logoBoxSmall}>
                            <Text style={styles.logoTextSmall}>T</Text>
                        </View>
                        <Text style={styles.headerBrand}>Tamias<Text style={styles.brandAccent}>POS</Text></Text>
                    </View>
                </View>

                {/* Sidebar Modal */}
                <Modal
                    visible={menuOpen}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setMenuOpen(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setMenuOpen(false)}
                    >
                        <View style={styles.sidebar} onStartShouldSetResponder={() => true}>
                            {/* Header */}
                            <View style={styles.sidebarHeader}>
                                <View style={styles.logoRow}>
                                    <View style={styles.logoBox}>
                                        <Text style={styles.logoText}>T</Text>
                                    </View>
                                    <Text style={styles.brandName}>Tamias<Text style={styles.brandAccent}>POS</Text></Text>
                                </View>
                                <TouchableOpacity onPress={() => setMenuOpen(false)}>
                                    <X size={24} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Nav Items */}
                            <View style={styles.navItems}>
                                {navItems.map((item) => {
                                    const isActive = currentRoute === item.name || (item.name === "index" && currentRoute === "(tabs)");
                                    const Icon = item.icon;

                                    return (
                                        <TouchableOpacity
                                            key={item.name}
                                            style={[styles.navItem, isActive && styles.navItemActive]}
                                            onPress={() => handleNavigation(item.name)}
                                        >
                                            <Icon size={22} color={isActive ? COLORS.primary : COLORS.textSecondary} />
                                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Logout */}
                            <View style={styles.sidebarFooter}>
                                <TouchableOpacity
                                    style={styles.logoutBtn}
                                    onPress={() => {
                                        setMenuOpen(false);
                                        router.replace("/login");
                                    }}
                                >
                                    <LogOut size={20} color={COLORS.red} />
                                    <Text style={styles.logoutText}>Keluar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
                        <Tabs.Screen name="index" options={{ href: "/(tabs)/" }} />
                        <Tabs.Screen name="pos" />
                        <Tabs.Screen name="products" />
                        <Tabs.Screen name="history" />
                        <Tabs.Screen name="settings" />
                    </Tabs>
                </View>
            </View>
        );
    }

    // Phone/Portrait: Bottom tabs
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === "ios" ? 88 : 70,
                    paddingBottom: Platform.OS === "ios" ? 28 : 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    href: "/(tabs)/",
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="pos"
                options={{
                    title: "Kasir",
                    tabBarIcon: ({ color, size }) => <ShoppingCart size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "Riwayat",
                    tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: "Produk",
                    tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Setting",
                    tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        paddingTop: 35,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    burgerButton: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    headerLogo: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 16,
    },
    logoBoxSmall: {
        width: 32,
        height: 32,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    logoTextSmall: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
    headerBrand: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        flexDirection: "row",
    },
    sidebar: {
        width: 280,
        backgroundColor: COLORS.surface,
        height: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    sidebarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    logoRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoBox: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    logoText: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.white,
    },
    brandName: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    brandAccent: {
        color: COLORS.primary,
    },
    navItems: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    navItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    navItemActive: {
        backgroundColor: COLORS.primaryLight,
    },
    navLabel: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginLeft: 14,
        fontWeight: "500",
    },
    navLabelActive: {
        color: COLORS.primary,
        fontWeight: "600",
    },
    sidebarFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: "#fef2f2",
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 15,
        color: COLORS.red,
        fontWeight: "600",
        marginLeft: 12,
    },
    mainContent: {
        flex: 1,
    },
});
