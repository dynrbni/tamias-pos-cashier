import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, useWindowDimensions, Alert, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";

// ... existing imports ...

// ... existing imports ...
import { StatusBar } from "expo-status-bar";
import { Search, Plus, Minus, Trash2, Check, X } from "lucide-react-native";
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { getProducts, createTransaction, getStoreId, getCurrentEmployeeId, formatCurrency, getStore } from "../../lib/api";
import { Product, supabase } from "../../lib/supabase";

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

type CartItem = {
    id: string;
    product_id: string;
    name: string;
    price: number;
    qty: number;
    image_url?: string | null;
};

export default function POS() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const isLandscape = width > height;

    const [products, setProducts] = useState<Product[]>([]);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [displayId, setDisplayId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [cart, setCart] = useState<CartItem[]>([]);

    // Payment modal
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [paymentAmount, setPaymentAmount] = useState("");

    // Get unique categories from products
    const categories = [
        { id: "all", name: "Semua" },
        ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))
            .map(cat => ({ id: cat!, name: cat! }))
    ];

    // Realtime Broadcast
    const [channel, setChannel] = useState<any>(null);

    const [isDisplayConnected, setIsDisplayConnected] = useState(false);

    useEffect(() => {
        if (!storeId || !employeeId) return;

        // Channel specific to this employee
        const newChannel = supabase.channel(`store-${storeId}-employee-${employeeId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = newChannel.presenceState();
                console.log("Presence Sync:", state);
                const hasDisplay = Object.values(state).some((presences: any) =>
                    presences.some((p: any) => p.type === 'display')
                );
                setIsDisplayConnected(hasDisplay);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
                console.log("Presence Join:", newPresences);
                const hasDisplay = newPresences.some((p: any) => p.type === 'display');
                if (hasDisplay) setIsDisplayConnected(true);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
                console.log("Presence Leave:", leftPresences);
                // On leave, we need to re-check if any display is still there (though usually only 1)
                const state = newChannel.presenceState();
                const hasDisplay = Object.values(state).some((presences: any) =>
                    presences.some((p: any) => p.type === 'display')
                );
                setIsDisplayConnected(hasDisplay);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("POS Connected to Display Channel");
                }
            });
        setChannel(newChannel);

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [storeId, employeeId]);

    const broadcast = (event: string, payload: any) => {
        if (channel) {
            channel.send({
                type: 'broadcast',
                event,
                payload
            });
        }
    };

    // Broadcast cart updates
    useEffect(() => {
        broadcast('cart-update', { cart });
    }, [cart]);

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.barcode?.includes(search);
        const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
        return matchSearch && matchCategory && p.stock > 0;
    });

    const loadData = async () => {
        try {
            const id = getStoreId();
            if (!id) return;
            setStoreId(id);

            const empId = getCurrentEmployeeId();
            if (empId) setEmployeeId(empId);

            const storeData = await getStore(id);
            if (storeData) setDisplayId(storeData.display_id || null);

            const data = await getProducts(id);
            setProducts(data);
        } catch (err) {
            console.error("Load POS error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const addToCart = (product: Product) => {
        // Check stock
        const inCart = cart.find(item => item.product_id === product.id);
        const currentQty = inCart?.qty || 0;

        if (currentQty >= product.stock) {
            Alert.alert("Stok Habis", `Stok ${product.name} tidak mencukupi`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product_id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prev, {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                qty: 1,
                image_url: product.image_url,
            }];
        });
    };

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product_id === productId) {
                const product = products.find(p => p.id === productId);
                const maxStock = product?.stock || 999;
                const newQty = Math.max(0, Math.min(maxStock, item.qty + delta));
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const removeItem = (productId: string) => {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

    const openPaymentModal = () => {
        if (cart.length === 0) {
            Alert.alert("Keranjang Kosong", "Tambahkan produk terlebih dahulu");
            return;
        }
        setPaymentAmount(total.toString());
        setShowPayment(true);
    };

    // QRIS State
    const [qrisUrl, setQrisUrl] = useState<string | null>(null);
    // Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Initial check before payment
    const handlePayment = () => {
        if (!storeId || !employeeId) {
            Alert.alert("Error", "Data user tidak ditemukan");
            return;
        }

        const paidAmount = parseInt(paymentAmount) || 0;
        if (paidAmount < total) {
            Alert.alert("Error", "Jumlah pembayaran kurang");
            return;
        }

        if (paymentMethod === 'qris') {
            // Just process immediately since QR is already shown/scanned
            processTransaction();
        } else {
            broadcast('payment-start', { method: paymentMethod, total });
            processTransaction();
        }
    };

    const processTransaction = async () => {
        setIsProcessing(true);
        const paidAmount = parseInt(paymentAmount) || 0;

        try {
            await createTransaction({
                store_id: storeId!,
                cashier_id: employeeId!,
                subtotal: subtotal,
                tax: tax,
                discount: 0,
                total: total,
                payment_method: paymentMethod,
                payment_amount: paidAmount,
                change_amount: paidAmount - total,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.qty,
                })),
            });

            broadcast('payment-success', {
                total,
                change: paidAmount - total,
                method: paymentMethod
            });

            // Close Payment Modal first to prevent stacking issues
            setShowPayment(false);
            // Show custom success modal
            setShowSuccessModal(true);

            // NOTE: We do NOT clear cart/paymentAmount here anymore.
            // We wait until the user closes the Success Modal.

        } catch (err: any) {
            console.error("Payment error:", err);
            Alert.alert("Error", err.message || "Gagal memproses transaksi. Pastikan SQL Fix sudah dijalankan di Supabase.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTransactionComplete = () => {
        setShowSuccessModal(false);
        setShowPayment(false);
        setCart([]);
        setPaymentAmount("");
        setPaymentMethod("cash");
        setQrisUrl(null);
        loadData();
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Memuat produk...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                        </ScrollView>


                    </View>

                    {/* Products Grid */}
                    <ScrollView style={styles.productsGrid} showsVerticalScrollIndicator={false}>
                        {filteredProducts.length === 0 ? (
                            <View style={styles.emptyProducts}>
                                <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
                            </View>
                        ) : (
                            <View style={styles.productsWrapper}>
                                {filteredProducts.map(product => (
                                    <TouchableOpacity
                                        key={product.id}
                                        style={styles.productCard}
                                        onPress={() => addToCart(product)}
                                        activeOpacity={0.7}
                                    >
                                        {product.image_url ? (
                                            <Image source={{ uri: product.image_url }} style={styles.productImage} />
                                        ) : (
                                            <View style={[styles.productImage, styles.productPlaceholder]}>
                                                <Text style={styles.productInitial}>
                                                    {product.name.substring(0, 2).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        <View style={styles.productInfo}>
                                            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                            <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                                            <Text style={styles.productStock}>Stok: {product.stock}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Connection Status (Bottom Left) */}
                    <View style={{ position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isDisplayConnected ? '#22c55e' : '#ef4444',
                            marginRight: 6
                        }} />
                        <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>
                            {isDisplayConnected ? 'Display Connected' : 'Display Disconnected'}
                        </Text>
                        {displayId && (
                            <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold', marginLeft: 8, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' }}>
                                ID: {displayId}
                            </Text>
                        )}
                    </View>
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
                                {cart.map((item) => (
                                    <View key={item.product_id} style={styles.cartItem}>
                                        <View style={styles.cartItemTop}>
                                            <Text style={styles.cartItemName} numberOfLines={1}>{item.name}</Text>
                                            <TouchableOpacity onPress={() => removeItem(item.product_id)}>
                                                <Trash2 size={16} color={COLORS.red} />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.cartItemBottom}>
                                            <View style={styles.qtyControl}>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product_id, -1)}>
                                                    <Minus size={14} color={COLORS.text} />
                                                </TouchableOpacity>
                                                <Text style={styles.qtyValue}>{item.qty}</Text>
                                                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.product_id, 1)}>
                                                    <Plus size={14} color={COLORS.text} />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={styles.cartItemTotal}>{formatCurrency(item.price * item.qty)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>

                            {/* Summary */}
                            <View style={styles.summary}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Subtotal</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Pajak (10%)</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
                                </View>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                                </View>

                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.clearBtn} onPress={() => setCart([])}>
                                        <Text style={styles.clearBtnText}>Hapus</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.payBtn} onPress={openPaymentModal}>
                                        <Text style={styles.payBtnText}>Bayar Sekarang</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Payment Modal */}
            <Modal
                visible={showPayment}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowPayment(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.paymentModal}>
                        <View style={styles.paymentHeader}>
                            <Text style={styles.paymentTitle}>Pembayaran</Text>
                            <TouchableOpacity onPress={() => setShowPayment(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.paymentContent}>
                            <Text style={styles.paymentTotal}>{formatCurrency(total)}</Text>

                            <Text style={styles.paymentLabel}>Metode Pembayaran</Text>
                            <View style={styles.paymentMethods}>
                                {["cash", "qris", "card"].map(method => (
                                    <TouchableOpacity
                                        key={method}
                                        style={[styles.methodBtn, paymentMethod === method && styles.methodBtnActive]}
                                        onPress={() => {
                                            setPaymentMethod(method);

                                            // Generate QRIS URL immediately if method is QRIS
                                            let url = null;
                                            if (method === 'qris') {
                                                url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TamiasPOS-${Date.now()}`;
                                                setQrisUrl(url);
                                            } else {
                                                setQrisUrl(null);
                                            }

                                            // Broadcast immediately
                                            broadcast('payment-start', { method: method, qrisUrl: url, total });
                                        }}
                                    >
                                        <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                                            {method === "cash" ? "Tunai" : method === "qris" ? "QRIS" : "Kartu"}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {paymentMethod === "cash" && (
                                <>
                                    <Text style={styles.paymentLabel}>Jumlah Bayar</Text>
                                    <TextInput
                                        style={styles.paymentInput}
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                        keyboardType="numeric"
                                        placeholder="Masukkan jumlah"
                                    />
                                    {parseInt(paymentAmount) >= total && (
                                        <Text style={styles.changeAmount}>
                                            Kembalian: {formatCurrency(parseInt(paymentAmount) - total)}
                                        </Text>
                                    )}
                                </>
                            )}

                            {paymentMethod === "qris" && qrisUrl && (
                                <View style={{ alignItems: 'center', marginTop: 20 }}>
                                    <View style={{
                                        width: 180,
                                        height: 180,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 10,
                                        borderWidth: 1,
                                        borderColor: COLORS.border,
                                        borderRadius: 12
                                    }}>
                                        <ExpoImage
                                            source={{ uri: qrisUrl }}
                                            style={{ width: 160, height: 160 }}
                                            contentFit="contain"
                                            transition={500}
                                        />
                                    </View>
                                    <Text style={[styles.paymentLabel, { textAlign: 'center', fontSize: 12 }]}>
                                        Scan QRIS di layar Customer
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmBtn, isProcessing && styles.confirmBtnDisabled]}
                            onPress={handlePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <>
                                    <Check size={20} color={COLORS.white} />
                                    <Text style={styles.confirmBtnText}>Konfirmasi Pembayaran</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom Success Modal */}
            <Modal
                visible={showSuccessModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.paymentModal, { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 }]}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: COLORS.primaryLight,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 24
                        }}>
                            <Check size={40} color={COLORS.primary} />
                        </View>

                        <Text style={{ fontSize: 26, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, textAlign: 'center' }}>
                            Transaksi Berhasil!
                        </Text>
                        <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginBottom: 32, textAlign: 'center' }}>
                            Pembayaran telah dikonfirmasi
                        </Text>

                        <View style={{ width: '110%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 24, paddingHorizontal: 32, marginBottom: 40 }}>
                            <View style={[styles.summaryRow, { marginBottom: 20 }]}>
                                <Text style={styles.summaryLabel}>Total Pembayaran</Text>
                                <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.text }}>{formatCurrency(total)}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginBottom: parseInt(paymentAmount) > total ? 20 : 0 }]}>
                                <Text style={styles.summaryLabel}>Metode</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, textTransform: 'uppercase' }}>{paymentMethod}</Text>
                            </View>
                            {parseInt(paymentAmount) > total && (
                                <View style={[styles.summaryRow, { marginTop: 0 }]}>
                                    <Text style={styles.summaryLabel}>Kembalian</Text>
                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: COLORS.primary }}>
                                        {formatCurrency(parseInt(paymentAmount) - total)}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.confirmBtn, { width: '100%', borderRadius: 12, height: 56 }]}
                            onPress={handleTransactionComplete}
                        >
                            <Text style={styles.confirmBtnText}>Selesai & Cetak Struk</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ marginTop: 24, padding: 8 }}
                            onPress={handleTransactionComplete}
                        >
                            <Text style={{ color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 }}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
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
    mainLayout: {
        flex: 1,
        flexDirection: "row",
    },
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
    emptyProducts: {
        alignItems: "center",
        paddingVertical: 40,
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
    productPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primaryLight,
    },
    productInitial: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.primary,
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
    productStock: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
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
    // Payment Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    paymentModal: {
        width: "90%",
        maxWidth: 400,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        overflow: "hidden",
    },
    paymentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    paymentTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    paymentContent: {
        padding: 20,
    },
    paymentTotal: {
        fontSize: 32,
        fontWeight: "bold",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 24,
    },
    paymentLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 12,
    },
    paymentMethods: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    methodBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
    },
    methodBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    methodText: {
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    methodTextActive: {
        color: COLORS.white,
    },
    paymentInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
        textAlign: "center",
    },
    changeAmount: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.primary,
        textAlign: "center",
        marginTop: 12,
    },
    confirmBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        gap: 8,
    },
    confirmBtnDisabled: {
        opacity: 0.7,
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.white,
    },
});
