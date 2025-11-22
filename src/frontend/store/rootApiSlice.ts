/* eslint-disable @typescript-eslint/no-explicit-any */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';

const mutex = new Mutex(); // async-mutex install करना पड़ेगा: npm i async-mutex

const baseQuery = fetchBaseQuery({
    // baseUrl अगर चाहिए तो बाद में add कर लेना
    prepareHeaders: (headers) => {
        // Default headers (अगर कोई function है तो use करो, नहीं तो सीधे लिख दो)
        // headers.set('Content-Type', 'application/json');
        // headers.set('x-app', 'desktop'); // example

        // Secure token from your electron preload bridge
        const token = (window as any).secureStore?.getToken?.();
        if (token) headers.set('authorization', token);

        return headers;
    },
});

// Main baseQuery with reauth + offline check
const baseQueryWithReauth: any = async (args: any, api: any, extraOptions: any) => {
    // Offline check (तुम्हारा netInfo bridge)
    if (!(window as any).netInfo?.isOnline?.()) {
        return { error: { status: 'CUSTOM_ERROR', error: 'No internet connection' } };
    }

    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);

    // 401 → logout immediately (no refresh token logic)
    if (result.error?.status === 401) {
        if (!mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                (window as any).secureStore?.clear?.();
                localStorage.clear();
                sessionStorage.clear();
                // api.dispatch(logout()); // अगर logout action है तो
            } finally {
                release();
            }
        } else {
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }

    return result;
};

// Final clean API slice
export const rootApiSlice = createApi({
    baseQuery: baseQueryWithReauth,
    tagTypes: ['profile', 'user', 'inventory'], // जितने चाहिए add कर लो
    endpoints: () => ({}),
});