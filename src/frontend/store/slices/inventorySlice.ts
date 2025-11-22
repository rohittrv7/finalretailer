// import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// import { Product, Supplier, InventoryState } from '../../types/inventory.types';

// const initialState: InventoryState = {
//     products: [],
//     suppliers: [],
//     selectedProduct: null,
//     selectedSupplier: null,
//     loading: false,
//     error: null,
//     filters: {},
// };

// // ==================== Async Thunks with Electron IPC ====================

// export const fetchProducts = createAsyncThunk(
//     'inventory/fetchProducts',
//     async (_, { rejectWithValue }) => {
//         try {
//             const products = await window.electronAPI.getAllProducts();
//             return products;
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const addProduct = createAsyncThunk(
//     'inventory/addProduct',
//     async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
//         try {
//             const id = await window.electronAPI.insertProduct(product);
//             return { ...product, id, created_at: Date.now(), updated_at: Date.now() };
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const editProduct = createAsyncThunk(
//     'inventory/editProduct',
//     async ({ id, updates }: { id: string; updates: Partial<Product> }, { rejectWithValue }) => {
//         try {
//             await window.electronAPI.updateProduct(id, updates);
//             return { id, updates };
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const removeProduct = createAsyncThunk(
//     'inventory/removeProduct',
//     async (id: string, { rejectWithValue }) => {
//         try {
//             await window.electronAPI.deleteProduct(id);
//             return id;
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const searchProductsAsync = createAsyncThunk(
//     'inventory/searchProducts',
//     async (query: string, { rejectWithValue }) => {
//         try {
//             const products = await window.electronAPI.searchProducts(query);
//             return products;
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const fetchSuppliers = createAsyncThunk(
//     'inventory/fetchSuppliers',
//     async (_, { rejectWithValue }) => {
//         try {
//             const suppliers = await window.electronAPI.getAllSuppliers();
//             return suppliers;
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// export const addSupplier = createAsyncThunk(
//     'inventory/addSupplier',
//     async (supplier: Omit<Supplier, 'id' | 'created_at'>, { rejectWithValue }) => {
//         try {
//             const id = await window.electronAPI.insertSupplier(supplier);
//             return { ...supplier, id, created_at: Date.now() };
//         } catch (error: any) {
//             return rejectWithValue(error.message);
//         }
//     }
// );

// const inventorySlice = createSlice({
//     name: 'inventory',
//     initialState,
//     reducers: {
//         selectProduct: (state, action: PayloadAction<string>) => {
//             state.selectedProduct = state.products.find(p => p.id === action.payload) || null;
//         },
//         clearSelectedProduct: (state) => {
//             state.selectedProduct = null;
//         },
//         setFilters: (state, action: PayloadAction<Partial<InventoryState['filters']>>) => {
//             state.filters = { ...state.filters, ...action.payload };
//         },
//         clearFilters: (state) => {
//             state.filters = {};
//         },
//         clearError: (state) => {
//             state.error = null;
//         },
//     },
//     extraReducers: (builder) => {
//         // Fetch Products
//         builder
//             .addCase(fetchProducts.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(fetchProducts.fulfilled, (state, action) => {
//                 state.loading = false;
//                 state.products = action.payload;
//             })
//             .addCase(fetchProducts.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload as string;
//             });

//         // Add Product
//         builder
//             .addCase(addProduct.fulfilled, (state, action) => {
//                 state.products.push(action.payload as Product);
//             });

//         // Edit Product
//         builder
//             .addCase(editProduct.fulfilled, (state, action) => {
//                 const index = state.products.findIndex(p => p.id === action.payload.id);
//                 if (index !== -1) {
//                     state.products[index] = { ...state.products[index], ...action.payload.updates };
//                 }
//             });

//         // Remove Product
//         builder
//             .addCase(removeProduct.fulfilled, (state, action) => {
//                 state.products = state.products.filter(p => p.id !== action.payload);
//             });

//         // Fetch Suppliers
//         builder
//             .addCase(fetchSuppliers.fulfilled, (state, action) => {
//                 state.suppliers = action.payload;
//             });
//     },
// });

// export const {
//     selectProduct,
//     clearSelectedProduct,
//     setFilters,
//     clearFilters,
//     clearError,
// } = inventorySlice.actions;

// export default inventorySlice.reducer;