import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, useWindowDimensions, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { TrendingUp, Package, ArrowUpRight, ArrowDownRight, Bell, DollarSign, Users } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
    getDashboardStats,
    getRecentTransactions,
    getStoreId,
    getCurrentEmployee,
    formatCurrency,
    formatTime,
    DashboardStats
} from "../../lib/api";
import { Transaction } from "../../lib/supabase";

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
    red: "#ef4444",
};

export default function Dashboard() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState("Kasir");
    const [stats, setStats] = useState<DashboardStats>({
        todaySales: 0,
        salesChange: 0,
        todayTransactions: 0,
        todayItemsSold: 0,
        totalCustomers: 0,
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const loadData = async () => {
        try {
            const storeId = getStoreId();
            if (!storeId) return;

            // Load user name from employee
            const employee = getCurrentEmployee();
            if (employee) {
                setUserName(employee.name || 'Kasir');
            }

            // Load stats
            const dashStats = await getDashboardStats(storeId);
            setStats(dashStats);

            // Load recent transactions
            const recentTx = await getRecentTransactions(storeId, 5);
            setTransactions(recentTx);
        } catch (err) {
            console.error("Load dashboard error:", err);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{getGreeting()},</Text>
                    <Text style={styles.userName}>{userName}</Text>
                </View>
                <TouchableOpacity style={styles.notifButton}>
                    <Bell size={22} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* Sales Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Total Penjualan Hari Ini</Text>
                    <Text style={styles.summaryAmount}>{formatCurrency(stats.todaySales)}</Text>
                    <View style={[styles.summaryBadge, stats.salesChange < 0 && styles.summaryBadgeNegative]}>
                        {stats.salesChange >= 0 ? (
                            <ArrowUpRight size={16} color={COLORS.white} />
                        ) : (
                            <ArrowDownRight size={16} color={COLORS.white} />
                        )}
                        <Text style={styles.summaryBadgeText}>
                            {stats.salesChange >= 0 ? '+' : ''}{stats.salesChange}% dari kemarin
                        </Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={[styles.statsGrid, isTablet && styles.statsGridTablet]}>
                    <View style={[styles.statCard, { backgroundColor: COLORS.blueLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.blue }]}>
                            <TrendingUp size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Transaksi</Text>
                        <Text style={styles.statValue}>{stats.todayTransactions}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.orangeLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.orange }]}>
                            <Package size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Produk Terjual</Text>
                        <Text style={styles.statValue}>{stats.todayItemsSold}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.primary }]}>
                            <DollarSign size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Rata-rata</Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(stats.todayTransactions > 0 ? Math.round(stats.todaySales / stats.todayTransactions) : 0)}
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: COLORS.purpleLight }]}>
                        <View style={[styles.statIcon, { backgroundColor: COLORS.purple }]}>
                            <Users size={20} color={COLORS.white} />
                        </View>
                        <Text style={styles.statLabel}>Pelanggan</Text>
                        <Text style={styles.statValue}>{stats.totalCustomers}</Text>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
                    </View>

                    {transactions.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
                        </View>
                    ) : (
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
                                            <Text style={styles.txAvatarText}>#{tx.id.substring(0, 4)}</Text>
                                        </View>
                                        <View>
                                            <Text style={styles.txTitle}>Pembayaran #{tx.id.substring(0, 8)}</Text>
                                            <Text style={styles.txSubtitle}>
                                                {formatTime(tx.created_at)} • {tx.payment_method || 'Tunai'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.txAmount}>+{formatCurrency(tx.total)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
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
    loadingText: {
        marginTop: 12,
        color: COLORS.textSecondary,
        fontSize: 14,
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
    summaryBadgeNegative: {
        backgroundColor: "rgba(239,68,68,0.3)",
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
    emptyState: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 14,
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
        flex: 1,
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
