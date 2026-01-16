import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Calendar, Clock, CreditCard, Banknote, QrCode } from "lucide-react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { getTransactions, getStoreId, formatCurrency, formatDate, formatTime } from "../../lib/api";
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
    orange: "#f97316",
};

export default function History() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const loadData = async () => {
        try {
            const storeId = getStoreId();
            if (!storeId) return;

            const data = await getTransactions(storeId, 50);
            setTransactions(data);
        } catch (err) {
            console.error("Load history error:", err);
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

    const getPaymentIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case "qris":
                return <QrCode size={16} color={COLORS.blue} />;
            case "card":
            case "kartu":
                return <CreditCard size={16} color={COLORS.orange} />;
            default:
                return <Banknote size={16} color={COLORS.primary} />;
        }
    };

    const getPaymentLabel = (method: string) => {
        switch (method?.toLowerCase()) {
            case "qris":
                return "QRIS";
            case "card":
            case "kartu":
                return "Kartu";
            default:
                return "Tunai";
        }
    };

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, tx) => {
        const date = new Date(tx.created_at).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(tx);
        return groups;
    }, {} as Record<string, Transaction[]>);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat riwayat...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Riwayat Transaksi</Text>
                <Text style={styles.subtitle}>{transactions.length} transaksi</Text>
            </View>

            {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Belum ada transaksi</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                >
                    {Object.entries(groupedTransactions).map(([date, txs]) => (
                        <View key={date} style={styles.dateGroup}>
                            <View style={styles.dateHeader}>
                                <Calendar size={14} color={COLORS.textSecondary} />
                                <Text style={styles.dateText}>{formatDate(txs[0].created_at)}</Text>
                            </View>

                            {txs.map((tx) => {
                                const items = tx.items || [];
                                const itemCount = items.reduce((sum: number, item: any) =>
                                    sum + (item.quantity || item.qty || 0), 0
                                );

                                return (
                                    <TouchableOpacity
                                        key={tx.id}
                                        style={styles.transactionCard}
                                        onPress={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.txMain}>
                                            <View style={styles.txLeft}>
                                                <View style={styles.txIcon}>
                                                    {getPaymentIcon(tx.payment_method)}
                                                </View>
                                                <View>
                                                    <Text style={styles.txId}>#{tx.id.substring(0, 8)}</Text>
                                                    <View style={styles.txMeta}>
                                                        <Clock size={12} color={COLORS.textSecondary} />
                                                        <Text style={styles.txTime}>{formatTime(tx.created_at)}</Text>
                                                        <Text style={styles.txDot}>•</Text>
                                                        <Text style={styles.txMethod}>{getPaymentLabel(tx.payment_method)}</Text>
                                                        <Text style={styles.txDot}>•</Text>
                                                        <Text style={styles.txItems}>{itemCount} item</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <Text style={styles.txAmount}>{formatCurrency(tx.total)}</Text>
                                        </View>

                                        {/* Expanded details */}
                                        {selectedTx?.id === tx.id && (
                                            <View style={styles.txDetails}>
                                                <View style={styles.txDivider} />
                                                {items.map((item: any, idx: number) => (
                                                    <View key={idx} style={styles.txItem}>
                                                        <Text style={styles.txItemName}>
                                                            {item.name} x{item.quantity || item.qty}
                                                        </Text>
                                                        <Text style={styles.txItemPrice}>
                                                            {formatCurrency((item.price || 0) * (item.quantity || item.qty || 1))}
                                                        </Text>
                                                    </View>
                                                ))}
                                                <View style={styles.txSummary}>
                                                    <View style={styles.txSummaryRow}>
                                                        <Text style={styles.txSummaryLabel}>Subtotal</Text>
                                                        <Text style={styles.txSummaryValue}>{formatCurrency(tx.subtotal || 0)}</Text>
                                                    </View>
                                                    <View style={styles.txSummaryRow}>
                                                        <Text style={styles.txSummaryLabel}>Pajak</Text>
                                                        <Text style={styles.txSummaryValue}>{formatCurrency(tx.tax || 0)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </ScrollView>
            )}
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
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    dateGroup: {
        marginBottom: 20,
    },
    dateHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 6,
    },
    dateText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    transactionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    txMain: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    txLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    txId: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
    },
    txMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 4,
    },
    txTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    txDot: {
        color: COLORS.textSecondary,
    },
    txMethod: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    txItems: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    txDetails: {
        marginTop: 12,
    },
    txDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginBottom: 12,
    },
    txItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    txItemName: {
        fontSize: 13,
        color: COLORS.text,
    },
    txItemPrice: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    txSummary: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    txSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    txSummaryLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    txSummaryValue: {
        fontSize: 12,
        color: COLORS.text,
    },
});
