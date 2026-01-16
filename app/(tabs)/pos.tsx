import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, Plus, Minus, Trash2, User } from "lucide-react-native";
import { useState } from "react";

const COLORS = {
    primary: "#16a34a",
    primaryLight: "#dcfce7",
    primaryDark: "#15803d",
    background: "#f8fafc",
    surface: "#ffffff",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#64748b",
    white: "#ffffff",
    red: "#ef4444",
};

const categories = [
    { id: "all", name: "Semua" },
    { id: "food", name: "Makanan" },
    { id: "drink", name: "Minuman" },
    { id: "snack", name: "Snack" },
];

const products = [
    { id: 1, name: "Caesar Salad", price: 35000, category: "food", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop" },
    { id: 2, name: "Toast Delight", price: 28000, category: "food", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&h=200&fit=crop" },
    { id: 3, name: "Udang Wonton", price: 45000, category: "food", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop" },
    { id: 4, name: "Nasi Goreng", price: 25000, category: "food", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop" },
    { id: 5, name: "Mie Ayam", price: 22000, category: "food", image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop" },
    { id: 6, name: "Lychee Tea", price: 18000, category: "drink", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop" },
    { id: 7, name: "Es Kopi Susu", price: 22000, category: "drink", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop" },
    { id: 8, name: "Americano", price: 20000, category: "drink", image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&h=200&fit=crop" },
    { id: 9, name: "Teh Manis", price: 8000, category: "drink", image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=200&h=200&fit=crop" },
    { id: 10, name: "Keripik", price: 15000, category: "snack", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop" },
    { id: 11, name: "French Fries", price: 20000, category: "snack", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop" },
    { id: 12, name: "Oreo", price: 12000, category: "snack", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200&h=200&fit=crop" },
];

type CartItem = { id: number; name: string; price: number; qty: number };

export default function POS() {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isLandscape = width > height;

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const addToCart = (product: typeof products[0]) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const removeItem = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.mainLayout}>
                {/* LEFT - Products */}
                <View style={styles.productsPanel}>
                    {/* Search & Categories */}
                    <View style={styles.topBar}>
                        <View style={styles.searchBox}>
                            <Search size={18} color={COLORS.textSecondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Cari produk..."
                                placeholderTextColor={COLORS.textSecondary}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                        <View style={styles.categoryTabs}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Products Grid */}
                    <ScrollView style={styles.productsGrid} showsVerticalScrollIndicator={false}>
                        <View style={styles.productsWrapper}>
                            {filteredProducts.map(product => (
                                <TouchableOpacity
                                    key={product.id}
                                    style={styles.productCard}
                                    onPress={() => addToCart(product)}
                                    activeOpacity={0.7}
                                >
                                    <Image source={{ uri: product.image }} style={styles.productImage} />
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                        <Text style={styles.productPrice}>Rp {product.price.toLocaleString("id-ID")}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* RIGHT - Order Panel */}
                <View style={styles.orderPanel}>
                    <View style={styles.orderHeader}>
                        <Text style={styles.orderTitle}>Keranjang</Text>
                        <Text style={styles.orderCount}>{totalItems} item</Text>
                    </View>

                    {cart.length === 0 ? (
                        <View style={styles.emptyCart}>
                            <Text style={styles.emptyText}>Keranjang kosong</Text>
                            <Text style={styles.emptySubtext}>Tap produk untuk menambahkan</Text>
                        </View>
                    ) : (
                        <>
                            <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
                                {cart.map((item, index) => (
                                    <View key={item.id} style={styles.cartItem}>
                                        <View style={styles.cartItemTop}>
                                            <Text style={styles.cartItemName}>{item.name}</Text>
                                            <TouchableOpacity onPress={() => removeItem(item.id)}>
                                                <Trash2 size={16} color={COLORS.red} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.cartItemBottom}>
                                            <View style={styles.qtyControl}>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                                                    <Minus size={14} color={COLORS.text} />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyValue}>{item.qty}</Text>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                                                    <Plus size={14} color={COLORS.text} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={styles.cartItemTotal}>Rp {(item.price * item.qty).toLocaleString("id-ID")}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Summary */}
                            <View style={styles.summary}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>Rp {subtotal.toLocaleString("id-ID")}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Pajak (10%)</Text>
                                    <Text style={styles.summaryValue}>Rp {tax.toLocaleString("id-ID")}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>Rp {total.toLocaleString("id-ID")}</Text>
                                </View>

                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.clearBtn} onPress={() => setCart([])}>
                                        <Text style={styles.clearBtnText}>Hapus</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.payBtn}>
                                        <Text style={styles.payBtnText}>Bayar Sekarang</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    mainLayout: {
        flex: 1,
        flexDirection: "row",
    },
    // Products Panel
    productsPanel: {
        flex: 2,
        backgroundColor: COLORS.background,
    },
    topBar: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.text,
    },
    categoryTabs: {
        flexDirection: "row",
        gap: 8,
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
    },
    categoryTabActive: {
        backgroundColor: COLORS.primary,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    categoryTextActive: {
        color: COLORS.white,
    },
    productsGrid: {
        flex: 1,
        padding: 16,
    },
    productsWrapper: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    productCard: {
        width: "23%",
        minWidth: 140,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    productImage: {
        width: "100%",
        height: 100,
        backgroundColor: COLORS.border,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    // Order Panel
    orderPanel: {
        flex: 1,
        maxWidth: 340,
        backgroundColor: COLORS.surface,
        borderLeftWidth: 1,
        borderLeftColor: COLORS.border,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    orderTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    orderCount: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    emptyCart: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    emptySubtext: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    cartItems: {
        flex: 1,
    },
    cartItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cartItemTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    cartItemBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    qtyControl: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.text,
        minWidth: 28,
        textAlign: "center",
    },
    cartItemTotal: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.text,
    },
    summary: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 13,
        color: COLORS.text,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.text,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
    },
    clearBtn: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    clearBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    payBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
    },
    payBtnText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
});
