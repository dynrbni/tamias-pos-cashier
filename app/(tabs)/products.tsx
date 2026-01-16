// Force rebuild: 1
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal, Alert, ActivityIndicator, RefreshControl, Platform, Linking } from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { Search, Plus, Edit2, Trash2, X, Camera as CameraIcon, ScanLine } from "lucide-react-native";
import { useState, useCallback, useRef, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { getProducts, createProduct, updateProduct, deleteProduct, getStoreId, getCategories, formatCurrency } from "../../lib/api";
import { Product, supabase } from "../../lib/supabase";

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

const DEFAULT_CATEGORIES = ["Makanan", "Minuman", "Snack", "Lainnya"];

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [search, setSearch] = useState("");
    const [storeId, setStoreId] = useState<string | null>(null);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Barcode scanner
    const [scannerVisible, setScannerVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [formStock, setFormStock] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formCost, setFormCost] = useState("");
    const [formImageUrl, setFormImageUrl] = useState("");

    // Ref to track image URL synchronously (React state updates are async)
    const imageUrlRef = useRef<string>("");

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search)
    );

    const loadData = async () => {
        try {
            const id = getStoreId();
            if (!id) {
                console.log("No store ID found");
                return;
            }
            setStoreId(id);

            const productsData = await getProducts(id);
            console.log("Loaded products:", productsData.length);
            setProducts(productsData);

            // Load categories
            const cats = await getCategories(id);
            if (cats.length > 0) {
                setCategories(cats.map(c => c.name));
            }
        } catch (err) {
            console.error("Load products error:", err);
            Alert.alert("Error", "Gagal memuat produk");
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

    const openAddModal = () => {
        setEditingProduct(null);
        setFormName("");
        setFormPrice("");
        setFormCategory(categories[0] || "Lainnya");
        setFormStock("");
        setFormBarcode("");
        setFormCost("");
        setFormImageUrl("");
        imageUrlRef.current = "";
        setModalVisible(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormName(product.name);
        setFormPrice(product.price.toString());
        setFormCategory(product.category || categories[0] || "Lainnya");
        setFormStock(product.stock.toString());
        setFormBarcode(product.barcode || "");
        setFormCost((product as any).cost?.toString() || "");
        setFormImageUrl(product.image_url || "");
        imageUrlRef.current = product.image_url || "";
        setModalVisible(true);
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Error", "Izin akses galeri diperlukan");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (err) {
            console.error("Pick image error:", err);
            Alert.alert("Error", "Gagal memilih gambar");
        }
    };

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Error", "Izin kamera diperlukan");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadImage(result.assets[0].uri);
            }
        } catch (err) {
            console.error("Take photo error:", err);
            Alert.alert("Error", "Gagal mengambil foto");
        }
    };

    const uploadImage = async (uri: string) => {
        setIsUploading(true);
        try {
            // Fetch as ArrayBuffer for reliable binary upload
            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();

            // Generate unique filename - just the path, NOT including bucket name
            const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
            const filePath = `products / ${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext} `;

            console.log("Uploading to path:", filePath);

            // Upload to Supabase Storage bucket "images"
            // Supabase-js v2 supports ArrayBuffer
            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, arrayBuffer, {
                    contentType: `image / ${ext === 'jpg' ? 'jpeg' : ext} `,
                    upsert: true,
                });

            if (error) {
                console.error("Supabase upload error:", error);
                throw error;
            }

            console.log("Upload success:", data);

            // Construct public URL manually
            // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
            const publicUrl = `https://lzcacsiuskiewpbxfavv.supabase.co/storage/v1/object/public/images/${filePath}`;
            console.log("Constructed Public URL:", publicUrl);

            // Update ref immediately
            imageUrlRef.current = publicUrl;

            // Set state immediately to verify
            setFormImageUrl(publicUrl);

            Alert.alert("Sukses", "Foto berhasil diupload");
        } catch (err: any) {
            console.error("Upload error:", err);
            Alert.alert("Upload Gagal", err.message || "Tidak bisa mengupload gambar. Pastikan bucket 'images' sudah dibuat di Supabase Storage.");
        } finally {
            setIsUploading(false);
        }
    };

    // Track if modal was open before scanning
    const [tempModalVisible, setTempModalVisible] = useState(false);

    // Ref to prevent duplicate scans synchronously
    const isScanningRef = useRef(false);

    const openBarcodeScanner = async () => {
        // Reset check
        isScanningRef.current = false;

        // Close modal first if open
        if (modalVisible) {
            setTempModalVisible(true);
            setModalVisible(false);
        }

        // Debug alert to confirm touch
        // console.log("Opening scanner...");

        try {
            let currentPerm = permission;

            // If permission is null (loading), try to request it explicitly
            if (!currentPerm) {
                currentPerm = await requestPermission();
            }

            if (currentPerm?.granted) {
                setScanned(false);
                setScannerVisible(true);
            } else {
                // If not granted, try to ask again if possible
                if (currentPerm?.canAskAgain) {
                    const result = await requestPermission();
                    if (result.granted) {
                        setScanned(false);
                        setScannerVisible(true);
                        return;
                    }
                }

                // If still not granted or cannot ask
                Alert.alert(
                    "Izin Kamera Diperlukan",
                    "Mohon izinkan akses kamera di pengaturan agar bisa scan barcode.",
                    [
                        { text: "Batal", style: "cancel" },
                        { text: "Buka Pengaturan", onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } catch (err) {
            console.error("Scanner error:", err);
            Alert.alert("Error", "Gagal membuka scanner: " + (err as Error).message);
        }
    };

    const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
        // Check ref synchronously
        if (isScanningRef.current || scanned) return;

        // Lock immediately
        isScanningRef.current = true;
        setScanned(true); // Update state for UI

        console.log("Scanned barcode:", type, data);

        // Close first, then alert
        setScannerVisible(false);
        setFormBarcode(data);

        // Re-open modal if it was open before
        if (tempModalVisible) {
            setModalVisible(true);
            setTempModalVisible(false);
        }

        // Show alert after state updates
        setTimeout(() => {
            Alert.alert("Berhasil", `Barcode ditemukan: ${data}`);
        }, 500);
    };

    const closeScanner = () => {
        setScannerVisible(false);
        // Re-open modal if it was open before
        if (tempModalVisible) {
            setModalVisible(true);
            setTempModalVisible(false);
        }
    };

    const handleSave = async () => {
        if (!formName || !formPrice || !formStock) {
            Alert.alert("Error", "Nama, harga, dan stok harus diisi");
            return;
        }

        if (!storeId) {
            Alert.alert("Error", "Store ID tidak ditemukan");
            return;
        }

        setIsSaving(true);

        try {
            // Use ref value if state hasn't updated yet
            const finalImageUrl = formImageUrl || imageUrlRef.current || null;

            const productData = {
                store_id: storeId,
                name: formName,
                price: parseInt(formPrice),
                cost: parseInt(formCost) || 0,
                category: formCategory,
                stock: parseInt(formStock),
                barcode: formBarcode || null,
                image_url: finalImageUrl,
            };

            console.log("Saving product:", productData);
            console.log("formImageUrl state:", formImageUrl);
            console.log("imageUrlRef:", imageUrlRef.current);

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
                Alert.alert("Sukses", "Produk berhasil diperbarui");
            } else {
                await createProduct(productData);
                Alert.alert("Sukses", "Produk berhasil ditambahkan");
            }

            setModalVisible(false);
            loadData();
        } catch (err: any) {
            console.error("Save error:", err);
            Alert.alert("Error", err.message || "Gagal menyimpan produk");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (product: Product) => {
        Alert.alert(
            "Hapus Produk",
            `Yakin ingin menghapus "${product.name}"?`,
            [
                { text: "Batal", style: "cancel" },
                {
                    text: "Hapus",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteProduct(product.id);
                            Alert.alert("Sukses", "Produk berhasil dihapus");
                            loadData();
                        } catch (err: any) {
                            Alert.alert("Error", err.message || "Gagal menghapus produk");
                        }
                    }
                },
            ]
        );
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

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Produk</Text>
                    <Text style={styles.subtitle}>{products.length} produk terdaftar</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                    <Plus size={20} color={COLORS.white} />
                    <Text style={styles.addButtonText}>Tambah</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cari produk atau barcode..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Products List */}
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {filteredProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {search ? "Produk tidak ditemukan" : "Belum ada produk"}
                        </Text>
                        {!search && (
                            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
                                <Text style={styles.emptyButtonText}>Tambah Produk Pertama</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.productGrid}>
                        {filteredProducts.map(product => (
                            <View key={product.id} style={styles.productCard}>
                                <View style={styles.productImage}>
                                    {product.image_url ? (
                                        <Image
                                            source={{ uri: product.image_url }}
                                            style={styles.productImg}
                                            contentFit="cover"
                                            cachePolicy="none"
                                            onError={(e) => console.log("Image load error:", e.error)}
                                        />
                                    ) : (
                                        <View style={styles.productPlaceholder}>
                                            <Text style={styles.productInitial}>
                                                {product.name.substring(0, 2).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                    <Text style={styles.productCategory}>{product.category || '-'}</Text>
                                    <Text style={styles.productPrice}>{formatCurrency(product.price)}</Text>
                                    <Text style={styles.productStock}>Stok: {product.stock}</Text>
                                </View>
                                <View style={styles.productActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => openEditModal(product)}
                                    >
                                        <Edit2 size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDelete(product)}
                                    >
                                        <Trash2 size={18} color={COLORS.red} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>
                            {editingProduct ? "Edit Produk" : "Tambah Produk"}
                        </Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Image Upload */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Foto Produk</Text>
                            <View style={styles.imageSection}>
                                <View style={styles.imagePreview}>
                                    {formImageUrl ? (
                                        <Image
                                            source={{ uri: formImageUrl }}
                                            style={styles.previewImg}
                                            contentFit="cover"
                                            cachePolicy="none"
                                            onError={(e) => {
                                                console.log("Preview load error:", e.error);
                                            }}
                                        />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <CameraIcon size={32} color={COLORS.textSecondary} />
                                        </View>
                                    )}
                                    {isUploading && (
                                        <View style={styles.uploadingOverlay}>
                                            <ActivityIndicator color={COLORS.white} />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.imageButtons}>
                                    <TouchableOpacity style={styles.imageBtn} onPress={pickImage} disabled={isUploading}>
                                        <Text style={styles.imageBtnText}>Ambil Foto dari Galeri</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.imageBtn} onPress={takePhoto} disabled={isUploading}>
                                        <Text style={styles.imageBtnText}>Ambil Foto dari Kamera</Text>
                                    </TouchableOpacity>
                                    {formImageUrl && (
                                        <TouchableOpacity
                                            style={[styles.imageBtn, styles.imageBtnDanger]}
                                            onPress={() => setFormImageUrl("")}
                                        >
                                            <Text style={styles.imageBtnDangerText}>Hapus Foto</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Nama Produk *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Contoh: Nasi Goreng"
                                placeholderTextColor={COLORS.textSecondary}
                                value={formName}
                                onChangeText={setFormName}
                            />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Harga Jual *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="25000"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formPrice}
                                    onChangeText={setFormPrice}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Harga Modal</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="15000"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formCost}
                                    onChangeText={setFormCost}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Kategori</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.categoryPicker}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[
                                                styles.categoryChip,
                                                formCategory === cat && styles.categoryChipActive
                                            ]}
                                            onPress={() => setFormCategory(cat)}
                                        >
                                            <Text style={[
                                                styles.categoryChipText,
                                                formCategory === cat && styles.categoryChipTextActive
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Stok *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="100"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={formStock}
                                    onChangeText={setFormStock}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                                <Text style={styles.label}>Barcode</Text>
                                <View style={styles.barcodeInput}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        placeholder="Scan/ketik"
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={formBarcode}
                                        onChangeText={setFormBarcode}
                                    />
                                    <TouchableOpacity style={styles.scanBtn} onPress={openBarcodeScanner}>
                                        <ScanLine size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.saveButton, (isSaving || isUploading) && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={isSaving || isUploading}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {editingProduct ? "Simpan Perubahan" : "Tambah Produk"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Barcode Scanner Overlay - Full Screen Absolute View */}
            {scannerVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: 'black' }]}>
                    <View style={[styles.scannerContainer, { paddingTop: Platform.OS === 'ios' ? 40 : 10 }]}>
                        <View style={styles.scannerHeader}>
                            <TouchableOpacity
                                style={styles.scannerCloseBtn}
                                onPress={closeScanner}
                            >
                                <X size={24} color={COLORS.white} />
                            </TouchableOpacity>
                            <Text style={styles.scannerTitle}>Scan Barcode</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        {permission?.granted ? (
                            <View style={styles.scanner}>
                                <CameraView
                                    style={StyleSheet.absoluteFillObject}
                                    facing="back"
                                    barcodeScannerSettings={{
                                        barcodeTypes: ["ean13", "ean8", "qr"],
                                    }}
                                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                                />

                                <View style={styles.scannerOverlay}>
                                    <View style={styles.scannerFrame}>
                                        <View style={[styles.scannerCorner, styles.topLeft]} />
                                        <View style={[styles.scannerCorner, styles.topRight]} />
                                        <View style={[styles.scannerCorner, styles.bottomLeft]} />
                                        <View style={[styles.scannerCorner, styles.bottomRight]} />
                                    </View>
                                    <Text style={styles.scannerHint}>Arahkan kamera ke barcode</Text>

                                    {scanned && (
                                        <TouchableOpacity
                                            style={styles.rescanBtn}
                                            onPress={() => setScanned(false)}
                                        >
                                            <Text style={styles.rescanText}>Scan Lagi</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.permissionContainer}>
                                <Text style={styles.permissionText}>Izin kamera belum diberikan</Text>
                                <TouchableOpacity
                                    style={styles.permissionBtn}
                                    onPress={openBarcodeScanner}
                                >
                                    <Text style={styles.permissionBtnText}>Buka Izin Kamera</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
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
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addButtonText: {
        color: COLORS.white,
        fontWeight: "600",
        marginLeft: 6,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        marginHorizontal: 20,
        marginVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    emptyButton: {
        marginTop: 16,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        color: COLORS.white,
        fontWeight: "600",
    },
    productGrid: {
        gap: 12,
        paddingBottom: 20,
    },
    productCard: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 12,
        alignItems: "center",
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        overflow: "hidden",
    },
    productImg: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    productPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    productInitial: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
    },
    productCategory: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primary,
        marginTop: 4,
    },
    productStock: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    productActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteButton: {
        backgroundColor: COLORS.redLight,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.text,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: "row",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
    },
    // Image upload
    imageSection: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    previewImg: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    imagePlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    imageButtons: {
        flex: 1,
        gap: 8,
    },
    imageBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    imageBtnDanger: {
        borderColor: COLORS.red,
        backgroundColor: COLORS.redLight,
    },
    imageBtnText: {
        color: COLORS.text,
        fontWeight: "500",
    },
    imageBtnDangerText: {
        color: COLORS.red,
        fontWeight: "500",
    },
    // Barcode input
    barcodeInput: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    scanBtn: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    // Category picker
    categoryPicker: {
        flexDirection: "row",
        gap: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryChipText: {
        color: COLORS.textSecondary,
        fontWeight: "500",
    },
    categoryChipTextActive: {
        color: COLORS.white,
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    // Scanner styles
    scannerContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    scannerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
        paddingBottom: 16,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    scannerCloseBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    scannerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.white,
    },
    scanner: {
        flex: 1,
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scannerFrame: {
        width: 280,
        height: 200,
        position: "relative",
    },
    scannerCorner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: COLORS.primary,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    scannerHint: {
        color: COLORS.white,
        marginTop: 30,
        fontSize: 16,
        textAlign: "center",
    },
    rescanBtn: {
        marginTop: 20,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    rescanText: {
        color: COLORS.white,
        fontWeight: "600",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    permissionText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
    },
    permissionBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    permissionBtnText: {
        color: COLORS.white,
        fontWeight: "bold",
        fontSize: 16,
    },
});
