import { useEffect, useState } from "react";
import { Search, Calendar, Eye, ArrowLeft, Phone } from "lucide-react";
import CustomTable, { Column } from "@/frontend/components/CustomTable";
import MainLayout from "../components/Layout/MainLayout";
import { formatDateTime } from "../helper/helper";
import InvoiceModal from "../components/Invoice/InvoiceModel";
import { InvoiceData } from "../types/invoice";

interface Invoice {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  date: string;
  customerName: string | null;
  customerPhone: string | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "Paid" | "Pending" | "Cancelled" | "Partially Paid";
}

export default function InvoiceHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(
    null
  );
  const [invoice, setInvoice] = useState<Invoice[] | null>(null);

  const loadInvoices = async () => {
    const response = await window.electronAPI.invoice.getAll();
    if (response.success && response.data) {
      setInvoice(response.data);
    }
  };

  const loadInvoicesDetails = async (id: string) => {
    const response = await window.electronAPI.invoice.getById(id);
    if (response.success && response.data) {
      setSelectedInvoice(response.data);
    }
  };

  const handleLoadInvoice = (id: string) => {
    loadInvoicesDetails(id);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice No",
      sortable: true,
      render: (item) => (
        <span className="font-bold text-blue-600">#{item.invoiceNumber}</span>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          {/* <Calendar className="w-4 h-4 text-gray-400" /> */}
          <span className="text-sm">{formatDateTime(item.date)}</span>
        </div>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (item) => (
        <div>
          <p className="font-medium">{item.customerName || "-"}</p>
          {item.customerPhone && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {item.customerPhone}
            </p>
          )}
        </div>
      ),
    },
    // {
    //   key: "itemsCount",
    //   header: "Items",
    //   align: "center",
    //   render: (item) => (
    //     <div className="flex items-center justify-center gap-2">
    //       <Package className="w-4 h-4 text-gray-400" />
    //       <span className="font-medium">{item.itemsCount}</span>
    //     </div>
    //   ),
    // },

    {
      key: "grandTotal",
      header: "Total Amount",
      align: "right",
      render: (item) => (
        <p className="font-black text-green-600">
          ₹{item.grandTotal.toFixed(2)}
        </p>
      ),
    },
    {
      key: "paidAmount",
      header: "Paid Amount",
      align: "right",
      render: (item) => (
        <p className="font-black text-green-600">
          ₹{item.paidAmount.toFixed(2)}
        </p>
      ),
    },
    {
      key: "dueAmount",
      header: "Due Amount",
      align: "right",
      render: (item) => (
        <p className="font-black text-green-600">
          ₹{item.dueAmount.toFixed(2)}
        </p>
      ),
    },
    {
      key: "paymentStatus",
      header: "Status",
      align: "center",
      render: (item) => (
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            item.paymentStatus === "Paid"
              ? "bg-green-100 text-green-800"
              : item.paymentStatus === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.paymentStatus}
        </span>
      ),
    },
    {
      key: "id",
      header: "Payment",
      align: "center",
      render: (item) => {
        const dueAmount = item.dueAmount ?? item.dueAmount ?? 0;

        return dueAmount > 0 ? (
          <button className="px-4 py-2 text-red-500 rounded-xl whitespace-nowrap">
            Due
          </button>
        ) : (
          <span className="text-gray-500">Settled</span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "center",
      render: (item) => {
        return (
          <button
            onClick={() => {
              handleLoadInvoice(item.id);
            }}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer"
          >
            <Eye className="w-5 h-5" />
          </button>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => window.history.back()}
                className="p-3 bg-white cursor-pointer dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                Invoice History
              </h1>
            </div>

            {/* Search */}
            <div className="max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
          </div>

          <CustomTable data={invoice || []} columns={columns} />
        </div>

        {selectedInvoice && (
          <InvoiceModal
            selectedInvoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
