import { useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  Search,
  QrCodeScanner,
  Close,
  CreditCard,
  AccountBalanceWallet,
  Receipt,
  Add,
  Mail,
  Phone,
  Edit,
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";
import CatalogModal from "../components/POS/CatalogModal";
import { TableColumn } from "@/types/common";
import { getTierColor, sampleCustomers } from "@/data/data";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

// interface CartItem {
//   id: string;
//   name: string;
//   qty: number | string;
//   price: string;
//   total: string;
// }

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  tier: "Platinum" | "Gold" | "Silver" | "Regular";
  totalSpent: string;
  visits: number;
  lastVisit: string;
}

export default function POSBilling() {
  const [showCatalog, setShowCatalog] = useState(false);
  // const [page, setPage] = useState(1);
  // const [perPage, setPerPage] = useState(10);
  // const cartItems: CartItem[] = [
  //   { id: "1", name: "Bread Loaf", qty: 2, price: "$2.50", total: "$5.00" },
  //   { id: "1", name: "Eggs (12)", qty: 1, price: "$3.20", total: "$3.20" },
  //   {
  //     id: "1",
  //     name: "Bananas",
  //     qty: "1.2kg",
  //     price: "$1.80/kg",
  //     total: "$2.16",
  //   },
  // ];

 const columns: TableColumn<Customer>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: 'name',
      cell: (value: string, row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {value.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      id: 'contact',
      header: 'Contact',
      accessor: 'email',
      cell: (value: string, row: Customer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-700">
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm">{value}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs">{row.phone}</span>
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      id: 'tier',
      header: 'Tier',
      accessor: 'tier',
      cell: (value: Customer['tier']) => {
        const colors = getTierColor(value);
        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
            {value}
          </span>
        );
      },
    },
    {
      id: 'totalSpent',
      header: 'Total Spent',
      accessor: 'totalSpent',
      cell: (value: string) => (
        <span className="font-bold text-green-600">{value}</span>
      ),
    },
    {
      id: 'visits',
      header: 'Visits',
      accessor: 'visits',
      cell: (value: number) => (
        <span className="font-semibold text-gray-700">{value}</span>
      ),
    },
    {
      id: 'lastVisit',
      header: 'Last Visit',
      accessor: 'lastVisit',
      cell: (value: string) => (
        <span className="text-gray-600">{value}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      sortable: false,
      cell: (_: any, row: Customer) => (
        <div className="flex items-center gap-2">
          <button 
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Edit ${row.name}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Delete ${row.name}`);
            }}
          >
            <DeleteOutlineRoundedIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const products = [
    { id: 1, name: "Apple", qty: 2, price: 3.5 },
    { id: 2, name: "Banana", qty: 3, price: 1.2 },
    { id: 3, name: "Milk", qty: 1, price: 2.0 },
  ];

  const discount = 0.5;
  const taxRate = 0.83;

  const subtotal = products?.reduce((acc, p) => acc + p.qty * p.price, 0);
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;

  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
            >
              Billing (POS)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<QrCodeScanner />}
              sx={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "hsl(var(--primary))",
                  bgcolor: "hsl(var(--primary-light))",
                },
              }}
            >
              Barcode
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCatalog(true)}
              sx={{
                bgcolor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                px: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "var(--shadow-primary)",
                "&:hover": {
                  bgcolor: "hsl(var(--primary-hover))",
                },
              }}
            >
              New Sale
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Current Sale */}
          <Grid xs={12} md={8} size={8}>
            <Card
              sx={{
                bgcolor: "hsl(var(--card))",
                borderRadius: 1,
                boxShadow: "var(--shadow-md)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
                  >
                    Current Sale
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScanner />}
                      size="small"
                      sx={{
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                        textTransform: "none",
                        borderRadius: 2,
                      }}
                    >
                      Scan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Search />}
                      size="small"
                      onClick={() => setShowCatalog(true)}
                      sx={{
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                        textTransform: "none",
                        borderRadius: 2,
                      }}
                    >
                      Search
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={7}>
                      <TextField
                        fullWidth
                        placeholder="Scan barcode or type item name"
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <QrCodeScanner
                                sx={{ color: "hsl(var(--muted-foreground))" }}
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid xs={6} sm={2.5}>
                      <TextField
                        fullWidth
                        placeholder="Qty"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                    <Grid xs={6} sm={2.5}>
                      <TextField
                        fullWidth
                        placeholder="Discount code"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* <hr /> */}

                <CustomTable<Customer>
                  data={sampleCustomers}
                  columns={columns}
                  sortable={true}
                  onRowClick={(row) => console.log("Row clicked:", row)}
                />
                <Box sx={{ pt: 2, borderTop: "1px solid hsl(var(--border))" }}>
                  <TextField
                    fullWidth
                    placeholder="Add note (order, delivery, etc.)"
                    size="small"
                    multiline
                    rows={2}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Receipt />}
                    sx={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    sx={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Customer & Payment */}
          <Grid item xs={12} md={4} size={4}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 3 }}>
              {/* Payment Card */}
              <Card sx={{ maxWidth: 400, p: 2, borderRadius: 1, boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Payment
                  </Typography>

                  {/* Product List */}
                  <Box sx={{ mb: 2 }}>
                    {products?.map((p) => (
                      <Box
                        key={p.id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2">
                          {p.name} x {p.qty}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${(p.price * p.qty).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Summary */}
                  <Box sx={{ borderTop: "1px solid #ddd", pt: 2, mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Subtotal</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Discount</Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "green" }}
                      >
                        -${discount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">Tax (8%)</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${tax.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        ${total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Payment Methods */}
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    Methods
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CreditCard />}
                      >
                        Card
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Receipt />}
                      >
                        Cash
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AccountBalanceWallet />}
                      >
                        UPI
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button fullWidth variant="outlined">
                        Split
                      </Button>
                    </Grid>
                  </Grid>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Receipt />}
                    sx={{ py: 1.5 }}
                  >
                    Pay & Print Receipt
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <CatalogModal open={showCatalog} onClose={() => setShowCatalog(false)} />
    </MainLayout>
  );
}
