export interface StoreInfo {
  id: string; 
  storeName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  stateCode: string | null;
  isGstEnabled: number; 
  gstIncludedDefault: number;
  invoicePrefix: string;
  invoiceStartNumber: number;
  createdAt: string; 
  updatedAt: string; 
}
