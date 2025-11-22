import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface QuickAddItem {
    id: string | number;
    productName: string;
    price: number;
    quantity: number;
}

interface QuickAddState {
    items: Record<string | number, QuickAddItem>;
}

export const quickAddSlice = createSlice({
    name: 'quickAdd',
    initialState: { items: {} } as QuickAddState,
    reducers: {
        addItem(state, action: PayloadAction<Omit<QuickAddItem, 'quantity'>>) {
            const { id, productName, price } = action.payload;
            if (!state.items[id]) {
                state.items[id] = { id, productName, price, quantity: 1 };
            }
        },

        increment(state, action: PayloadAction<string | number>) {
            const id = action.payload;
            if (state.items[id]) state.items[id].quantity += 1;
        },

        decrement(state, action: PayloadAction<string | number>) {
            const id = action.payload;
            if (state.items[id]) {
                state.items[id].quantity = Math.max(1, state.items[id].quantity - 1);
            }
        },

        removeItem(state, action: PayloadAction<string | number>) {
            delete state.items[action.payload];
        },

        clearAll(state) {
            state.items = {};
        },
    },
});

export const { addItem, increment, decrement, removeItem, clearAll } =
    quickAddSlice.actions;

export default quickAddSlice.reducer;