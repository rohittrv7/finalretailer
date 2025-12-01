export interface StoreInfo {
    id: string;
    storeName: string;
    email: string;
    phone: string;
    gstin: string;
    companyName: string;
    taxId: string;
    address: string;
    logoUrl?: string;
    defaultTaxRate?: number;
    isGstEnabled: number;
}