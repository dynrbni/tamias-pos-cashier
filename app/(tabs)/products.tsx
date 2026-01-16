import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, SafeAreaView, Modal, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Search, Plus, Edit2, Trash2, X, Camera, Barcode } from "lucide-react-native";
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
    redLight: "#fef2f2",
};

const CATEGORIES = ["Makanan", "Minuman", "Snack", "Dessert"];

const SAMPLE_IMAGES = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200&h=200&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop",
];

type Product = {
    id: number;
    name: string;
    price: number;
    category: string;
    stock: number;
    image: string;
    barcode: string;
};

const initialProducts: Product[] = [
    { id: 1, name: "Caesar Salad", price: 35000, category: "Makanan", stock: 50, barcode: "8991234567001", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop" },
    { id: 2, name: "Toast Delight", price: 28000, category: "Makanan", stock: 30, barcode: "8991234567002", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=200&h=200&fit=crop" },
    { id: 3, name: "Nasi Goreng", price: 25000, category: "Makanan", stock: 45, barcode: "8991234567003", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=200&fit=crop" },
    { id: 4, name: "Lychee Tea", price: 18000, category: "Minuman", stock: 100, barcode: "8991234567004", image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop" },
    { id: 5, name: "Es Kopi Susu", price: 22000, category: "Minuman", stock: 80, barcode: "8991234567005", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop" },
    { id: 6, name: "Keripik", price: 15000, category: "Snack", stock: 60, barcode: "8991234567006", image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop" },
];

export default function Products() {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [search, setSearch] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [imagePickerVisible, setImagePickerVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
    const [formStock, setFormStock] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formImage, setFormImage] = useState(SAMPLE_IMAGES[0]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search)
    );

    const openAddModal = () => {
        setEditingProduct(null);
        setFormName("");
        setFormPrice("");
        setFormCategory(CATEGORIES[0]);
        setFormStock("");
        setFormBarcode("");
        setFormImage(SAMPLE_IMAGES[0]);
        setModalVisible(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormPrice(product.price.toString());
        setFormCategory(product.category);
        setFormStock(product.stock.toString());
        setFormBarcode(product.barcode);
        setFormImage(product.image);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!formName || !formPrice || !formStock) {
            Alert.alert("Error", "Nama, harga, dan stok harus diisi");
            return;
        }

        if (editingProduct) {
            // Update existing
            setProducts(prev => prev.map(p =>
                p.id === editingProduct.id
                    ? {
                        ...p,
                        name: formName,
                        price: parseInt(formPrice),
                        category: formCategory,
                        stock: parseInt(formStock),
                        barcode: formBarcode,
                        image: formImage,
                    }
                    : p
            ));
        } else {
            // Add new
            const newProduct: Product = {
                id: Date.now(),
                name: formName,
                price: parseInt(formPrice),
                category: formCategory,
                stock: parseInt(formStock),
                barcode: formBarcode || `899${Date.now().toString().slice(-10)}`,
                image: formImage,
            };
            setProducts(prev => [...prev, newProduct]);
        }
        setModalVisible(false);
    };

    const handleDelete = (id: number) => {
        Alert.alert(
            "Hapus Produk",
            "Yakin ingin menghapus produk ini?",
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus", style: "destructive", onPress: () => {
                        setProducts(prev => prev.filter(p => p.id !== id));
                    }
                },
            ]
        );
    };

    const selectImage = (url: string) => {
        setFormImage(url);
        setImagePickerVisible(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Manajemen Produk</Text>
                    <Text style={styles.headerSubtitle}>{products.length} produk tersedia</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Plus size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Tambah Produk</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Search size={18} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari nama atau barcode..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Products List */}
            <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
                {filteredProducts.map(product => (
                    <View key={product.id} style={styles.productCard}>
                        <Image source={{ uri: product.image }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productCategory}>{product.category}</Text>
                            {product.barcode && (
                                <View style={styles.barcodeRow}>
                                    <Barcode size={12} color={COLORS.textSecondary} />
                                    <Text style={styles.barcodeText}>{product.barcode}</Text>
                                </View>
                            )}
                            <View style={styles.productMeta}>
                                <Text style={styles.productPrice}>Rp {product.price.toLocaleString("id-ID")}</Text>
                                <Text style={styles.productStock}>Stok: {product.stock}</Text>
                            </View>
                        </View>
                        <View style={styles.productActions}>
                            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(product)}>
                                <Edit2 size={18} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(product.id)}>
                                <Trash2 size={18} color={COLORS.red} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {/* Image Picker */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Foto Produk</Text>
                                <TouchableOpacity
                                    style={styles.imagePickerBtn}
                                    onPress={() => setImagePickerVisible(true)}
                                >
                                    <Image source={{ uri: formImage }} style={styles.imagePreview} />
                                    <View style={styles.imageOverlay}>
                                        <Camera size={24} color={COLORS.white} />
                                        <Text style={styles.imageOverlayText}>Ganti Foto</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Name */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Nama Produk *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Masukkan nama produk"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formName}
                                    onChangeText={setFormName}
                                />
                            </View>

                            {/* Barcode */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Barcode / SKU</Text>
                                <View style={styles.barcodeInputRow}>
                                    <TextInput
                                        style={[styles.formInput, { flex: 1 }]}
                                        placeholder="Scan atau masukkan barcode"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={formBarcode}
                                        onChangeText={setFormBarcode}
                                    />
                                    <TouchableOpacity style={styles.scanBtn}>
                                        <Barcode size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.formHint}>Kosongkan untuk generate otomatis</Text>
                            </View>

                            {/* Price */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Harga (Rp) *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Masukkan harga"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formPrice}
                                    onChangeText={setFormPrice}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Category */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Kategori</Text>
                                <View style={styles.categoryOptions}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.categoryOption, formCategory === cat && styles.categoryOptionActive]}
                                            onPress={() => setFormCategory(cat)}
                                        >
                                            <Text style={[styles.categoryOptionText, formCategory === cat && styles.categoryOptionTextActive]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Stock */}
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Stok *</Text>
                                <TextInput
                                    style={styles.formInput}
                                    placeholder="Jumlah stok"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formStock}
                                    onChangeText={setFormStock}
                                    keyboardType="numeric"
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>
                                    {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Image Picker Modal */}
            <Modal visible={imagePickerVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.imagePickerModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Foto</Text>
                            <TouchableOpacity onPress={() => setImagePickerVisible(false)}>
                                <X size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.imageGrid}>
                            {SAMPLE_IMAGES.map((url, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.imageOption, formImage === url && styles.imageOptionActive]}
                                    onPress={() => selectImage(url)}
                                >
                                    <Image source={{ uri: url }} style={styles.imageOptionImg} />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.imagePickerHint}>
                            💡 Di versi production, akan tersambung ke kamera atau galeri
                        </Text>
                    </View>
                </View>
            </Modal>
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
        paddingVertical: 20,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    addButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: "bold",
    },
    searchSection: {
        padding: 16,
        backgroundColor: COLORS.surface,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: COLORS.text,
    },
    productList: {
        flex: 1,
        padding: 16,
    },
    productCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
    },
    productCategory: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    barcodeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        gap: 4,
    },
    barcodeText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontFamily: "monospace",
    },
    productMeta: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        gap: 12,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    productStock: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    productActions: {
        flexDirection: "row",
        gap: 8,
    },
    editBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.redLight,
        alignItems: "center",
        justifyContent: "center",
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        width: "100%",
        maxWidth: 500,
        maxHeight: "85%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    modalBody: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
    },
    formInput: {
        backgroundColor: COLORS.background,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    formHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 6,
    },
    // Image Picker
    imagePickerBtn: {
        width: 120,
        height: 120,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
    },
    imagePreview: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: 8,
        alignItems: "center",
    },
    imageOverlayText: {
        fontSize: 11,
        color: COLORS.white,
        marginTop: 2,
    },
    // Barcode Input
    barcodeInputRow: {
        flexDirection: "row",
        gap: 10,
    },
    scanBtn: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    categoryOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    categoryOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryOptionActive: {
        backgroundColor: COLORS.primaryLight,
        borderColor: COLORS.primary,
    },
    categoryOptionText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    categoryOptionTextActive: {
        color: COLORS.primary,
        fontWeight: "600",
    },
    modalFooter: {
        flexDirection: "row",
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
    },
    cancelBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textSecondary,
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        alignItems: "center",
    },
    saveBtnText: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.white,
    },
    // Image Picker Modal
    imagePickerModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        width: "100%",
        maxWidth: 400,
        padding: 20,
    },
    imageGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 16,
    },
    imageOption: {
        width: 100,
        height: 100,
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "transparent",
    },
    imageOptionActive: {
        borderColor: COLORS.primary,
    },
    imageOptionImg: {
        width: "100%",
        height: "100%",
    },
    imagePickerHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginTop: 16,
    },
});
