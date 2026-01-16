import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzcacsiuskiewpbxfavv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6Y2Fjc2l1c2tpZXdwYnhmYXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTQ3NTIsImV4cCI6MjA4NDA5MDc1Mn0.ldFMwBQeoGHf9krKRgo23Csf-Pfom_cC7zJ66wRPdVc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Product = {
    id: string;
    store_id: string;
    name: string;
    price: number;
    category: string | null;
    stock: number;
    barcode: string | null;
    image_url: string | null;
    created_at: string;
};

export type Transaction = {
    id: string;
    store_id: string;
    cashier_id: string;
    total: number;
    tax: number;
    payment_method: string;
    items: CartItem[];
    created_at: string;
};

export type CartItem = {
    id: string;
    name: string;
    price: number;
    qty: number;
};

export type Profile = {
    id: string;
    full_name: string | null;
    role: string;
    store_id: string | null;
    created_at: string;
};

export type Store = {
    id: string;
    name: string;
    address: string | null;
    owner_id: string;
    created_at: string;
};
