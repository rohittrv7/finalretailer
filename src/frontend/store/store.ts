import { configureStore } from '@reduxjs/toolkit';
import { rootApiSlice } from './rootApiSlice';
import { quickAddSlice } from './slices/quickAddSlice';

export const store = configureStore({
    reducer: {
        quickAdd: quickAddSlice.reducer,
        [rootApiSlice.reducerPath]: rootApiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(rootApiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;