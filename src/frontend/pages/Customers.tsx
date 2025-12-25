import { useEffect, useState } from "react";
import { Phone, Calendar, IndianRupee, User, Search, Eye } from "lucide-react";
import MainLayout from "@/frontend/components/Layout/MainLayout";
import CustomTable, { Column } from "@/frontend/components/CustomTable";
import { formatDateTime } from "../helper/helper";
import CustomerDetailsModal from "../components/Customer/CustomerDetailsModal";
import { CustomerData } from "../types/customer";

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  lastVisit: string | null;
  dueAmount: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerDetail, setCustomerDetail] = useState<CustomerData>();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    // setLoading(true);
    try {
      const res = await window.electronAPI.customer.getAllCustomer();
      if (res.success && Array.isArray(res.data)) {
        setCustomers(res.data);
        // setFiltered(res.data);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      // setLoading(false);
    }
  };
  // console.log("object------customer----------", customers);

  const detailCustomer = async (id: string) => {
    const res = await window.electronAPI.customer.getById(id);
    if (res.success) {
      setCustomerDetail(res.data);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const customerColumns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {customer.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {customer.name}
            </div>
            {customer.address && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {customer.address}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Phone className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{customer.phone}</span>
        </div>
      ),
    },
    {
      key: "lastVisit",
      header: "Last Visit",
      sortable: true,
      render: (customer) => (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>{formatDateTime(customer.lastVisit)}</span>
        </div>
      ),
    },
    {
      key: "dueAmount",
      header: "Due Amount",
      align: "right",
      sortable: true,
      render: (customer) => (
        <div className="flex items-center justify-end gap-1">
          <IndianRupee className="w-4 h-4 text-red-500" />
          {customer.dueAmount > 0 ? (
            <span className="font-bold text-red-600">
              {customer.dueAmount.toFixed(2)}
            </span>
          ) : (
            <span className="font-medium text-green-600">₹0.00</span>
          )}
        </div>
      ),
    },
    {
      key: "id",
      header: "Payment",
      align: "center",
      render: (item) => {
        const dueAmount = item.dueAmount ?? item.dueAmount ?? 0;
        if (dueAmount > 0)
          return (
            <button
              // onClick={() => pay(item)} // item pass kar sakte ho agar id ya details chahiye
              className="px-4 py-2 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-xl whitespace-nowrap"
            >
              Pay
            </button>
          );

        return <span className="text-gray-500">Settled</span>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (customer) => (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            detailCustomer(customer.id.toString());
          }}
          className="p-2 cursor-pointer bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition"
        >
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Customers
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage customer relationships & credit balances
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Custom Table */}
          <CustomTable data={customers} columns={customerColumns} />
        </div>
      </div>

      <CustomerDetailsModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        data={customerDetail}
      />
    </MainLayout>
  );
}
