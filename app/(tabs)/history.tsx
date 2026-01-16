import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Clock, ChevronRight } from "lucide-react-native";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#dcfce7",
    background: "#f9fafb",
    surface: "#ffffff",
    border: "#e5e7eb",
    text: "#111827",
    textSecondary: "#6b7280",
    white: "#ffffff",
};

const transactions = [
    { id: "TRX-1001", date: "16 Jan 2026", time: "10:45", items: 5, total: 125000, status: "Selesai" },
    { id: "TRX-1002", date: "16 Jan 2026", time: "10:32", items: 3, total: 87500, status: "Selesai" },
    { id: "TRX-1003", date: "16 Jan 2026", time: "10:15", items: 2, total: 45000, status: "Selesai" },
    { id: "TRX-1004", date: "15 Jan 2026", time: "17:58", items: 8, total: 235000, status: "Selesai" },
    { id: "TRX-1005", date: "15 Jan 2026", time: "16:41", items: 4, total: 67500, status: "Selesai" },
    { id: "TRX-1006", date: "15 Jan 2026", time: "14:22", items: 6, total: 156000, status: "Selesai" },
];

export default function History() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Today */}
                <Text style={styles.dateLabel}>Hari Ini</Text>
                <View style={styles.transactionList}>
                    {transactions.slice(0, 3).map((tx, index) => (
                        <TouchableOpacity
                            key={tx.id}
                            style={[styles.transactionItem, index !== 2 && styles.transactionBorder]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.txLeft}>
                                <View style={styles.txIcon}>
                                    <Clock size={20} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.txId}>{tx.id}</Text>
                                    <Text style={styles.txMeta}>{tx.time} • {tx.items} item</Text>
                                </View>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={styles.txAmount}>Rp {tx.total.toLocaleString("id-ID")}</Text>
                                <ChevronRight size={20} color={COLORS.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Yesterday */}
                <Text style={styles.dateLabel}>Kemarin</Text>
                <View style={styles.transactionList}>
                    {transactions.slice(3).map((tx, index) => (
                        <TouchableOpacity
                            key={tx.id}
                            style={[styles.transactionItem, index !== 2 && styles.transactionBorder]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.txLeft}>
                                <View style={styles.txIcon}>
                                    <Clock size={20} color={COLORS.primary} />
                                </View>
                                <View>
                                    <Text style={styles.txId}>{tx.id}</Text>
                                    <Text style={styles.txMeta}>{tx.time} • {tx.items} item</Text>
                                </View>
                            </View>
                            <View style={styles.txRight}>
                                <Text style={styles.txAmount}>Rp {tx.total.toLocaleString("id-ID")}</Text>
                                <ChevronRight size={20} color={COLORS.textSecondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
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
    dateLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    transactionList: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        marginBottom: 24,
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
    txIcon: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 12,
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
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    txRight: {
        flexDirection: "row",
        alignItems: "center",
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "bold",
        color: COLORS.text,
        marginRight: 8,
    },
});
