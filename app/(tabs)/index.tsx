import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { TrendingUp, Package, ArrowUpRight, Bell, DollarSign, Users } from "lucide-react-native";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#dcfce7",
    background: "#f9fafb",
    surface: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#6b7280",
    white: "#ffffff",
    blue: "#3b82f6",
    blueLight: "#dbeafe",
    orange: "#f97316",
    orangeLight: "#ffedd5",
    purple: "#8b5cf6",
    purpleLight: "#ede9fe",
};

const transactions = [
    { id: "1001", time: "10:45", method: "Tunai", amount: 125000 },
    { id: "1002", time: "10:32", method: "QRIS", amount: 87500 },
    { id: "1003", time: "10:15", method: "Tunai", amount: 45000 },
    { id: "1004", time: "09:58", method: "Kartu", amount: 235000 },
    { id: "1005", time: "09:41", method: "Tunai", amount: 67500 },
];

export default function Dashboard() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Selamat Pagi,</Text>
                    <Text style={styles.userName}>Kasir Utama</Text>
                </View>
                <TouchableOpacity style={styles.notifButton}>
                    <Bell size={22} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Sales Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Penjualan Hari Ini</Text>
                    <Text style={styles.summaryAmount}>Rp 4.525.000</Text>
                    <View style={styles.summaryBadge}>
                        <ArrowUpRight size={16} color={COLORS.white} />
                        <Text style={styles.summaryBadgeText}>+12.5% dari kemarin</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.blueLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.blue }]}>
                            <TrendingUp size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Transaksi</Text>
                        <Text style={styles.statValue}>128</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.orangeLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.orange }]}>
                            <Package size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Produk Terjual</Text>
                        <Text style={styles.statValue}>847</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.primary }]}>
                            <DollarSign size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Rata-rata</Text>
                        <Text style={styles.statValue}>Rp 35.350</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.purpleLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.purple }]}>
                            <Users size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Pelanggan</Text>
                        <Text style={styles.statValue}>89</Text>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAllText}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.transactionList}>
                        {transactions.map((tx, index) => (
                            <View
                                key={tx.id}
                                style={[
                                    styles.transactionItem,
                                    index !== transactions.length - 1 && styles.transactionBorder
                                ]}
                            >
                                <View style={styles.txLeft}>
                                    <View style={styles.txAvatar}>
                                        <Text style={styles.txAvatarText}>#{tx.id}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.txTitle}>Pembayaran #{tx.id}</Text>
                                        <Text style={styles.txSubtitle}>{tx.time} • {tx.method}</Text>
                                    </View>
                                </View>
                                <Text style={styles.txAmount}>+Rp {tx.amount.toLocaleString("id-ID")}</Text>
                            </View>
                        ))}
                    </View>
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
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
    },
    notifButton: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.background,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    summaryCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.8)",
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: "bold",
        color: COLORS.white,
        marginBottom: 12,
    },
    summaryBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    summaryBadgeText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 4,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    statsGridTablet: {
        gap: 16,
    },
    statCard: {
        width: "48%",
        padding: 16,
        borderRadius: 16,
        flexGrow: 1,
        minWidth: 140,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.text,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
    },
    transactionList: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: "hidden",
    },
    transactionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    transactionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    txLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    txAvatar: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.background,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    txAvatarText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.textSecondary,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
    },
    txSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.primary,
    },
});
