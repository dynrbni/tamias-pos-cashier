import { supabase, Product, Transaction, Profile, Store } from './supabase';

// ============================================
// EMPLOYEE TYPE
// ============================================

export interface Employee {
    id: string;
    store_id: string;
    employee_id: string;
    name: string;
    phone: string;
    role: string;
    is_active: boolean;
    avatar_url?: string;
}

// ============================================
// AUTH & USER (Employee-based)
// ============================================

// Get current logged-in employee from global
export function getCurrentEmployee(): Employee | null {
    return (global as any).currentEmployee || null;
}

// Get current employee's store ID
export function getStoreId(): string | null {
    const employee = getCurrentEmployee();
    return employee?.store_id || (global as any).currentStoreId || null;
}

// Get current employee's ID (for transactions)
export function getCurrentEmployeeId(): string | null {
    const employee = getCurrentEmployee();
    return employee?.id || null;
}

// Sign out - clear global employee data
export function signOut() {
    (global as any).currentEmployee = null;
    (global as any).currentStoreId = null;
}

// Get store info
export async function getStore(storeId: string): Promise<Store | null> {
    const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

    return data;
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface DashboardStats {
    todaySales: number;
    salesChange: number;
    todayTransactions: number;
    todayItemsSold: number;
    totalCustomers: number;
}

export async function getDashboardStats(storeId: string): Promise<DashboardStats> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Today's transactions
    const { data: todayTx } = await supabase
        .from('transactions')
        .select('total, items')
        .eq('store_id', storeId)
        .gte('created_at', todayStart.toISOString());

    // Yesterday's transactions
    const { data: yesterdayTx } = await supabase
        .from('transactions')
        .select('total')
        .eq('store_id', storeId)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString());

    // Customers count
    const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);

    const todaySales = todayTx?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
    const yesterdaySales = yesterdayTx?.reduce((sum, t) => sum + (t.total || 0), 0) || 0;
    const todayCount = todayTx?.length || 0;

    const todayItems = todayTx?.reduce((sum, t) => {
        const items = t.items || [];
        return sum + items.reduce((s: number, i: any) => s + (i.quantity || i.qty || 0), 0);
    }, 0) || 0;

    const salesChange = yesterdaySales > 0
        ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
        : 0;

    return {
        todaySales,
        salesChange: Math.round(salesChange),
        todayTransactions: todayCount,
        todayItemsSold: todayItems,
        totalCustomers: customerCount || 0,
    };
}

export async function getRecentTransactions(storeId: string, limit = 5): Promise<Transaction[]> {
    const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

// ============================================
// PRODUCTS
// ============================================

export async function getProducts(storeId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactions(storeId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export interface CreateTransactionData {
    store_id: string;
    cashier_id: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    payment_method: string;
    payment_amount: number;
    change_amount: number;
    items: any[];
    customer_id?: string;
}

export async function createTransaction(transaction: CreateTransactionData): Promise<Transaction> {
    const { data, error } = await supabase
        .from('transactions')
        .insert([{
            ...transaction,
            status: 'completed',
        }])
        .select()
        .single();

    if (error) throw error;

    // Update stock for each item
    for (const item of transaction.items) {
        const productId = item.product_id || item.id;
        const qty = item.quantity || item.qty || 1;

        try {
            // Try RPC first
            await supabase.rpc('decrement_stock', {
                product_id: productId,
                qty: qty,
            });
        } catch {
            // Fallback: manual update
            const { data: prod } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();

            if (prod) {
                await supabase
                    .from('products')
                    .update({ stock: Math.max(0, prod.stock - qty) })
                    .eq('id', productId);
            }
        }
    }

    return data;
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories(storeId: string) {
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('name', { ascending: true });

    return data || [];
}

// ============================================
// HELPERS
// ============================================

export function formatCurrency(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
