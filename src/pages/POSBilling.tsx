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
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";
import CatalogModal from "../components/POS/CatalogModal";
import CustomTable, { TableColumn } from "@/components/Table";

interface CartItem {
  id: string;
  name: string;
  qty: number | string;
  price: string;
  total: string;
}

export default function POSBilling() {
  const [showCatalog, setShowCatalog] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const cartItems: CartItem[] = [
    { id: '1', name: "Bread Loaf", qty: 2, price: "$2.50", total: "$5.00" },
    { id: '1', name: "Eggs (12)", qty: 1, price: "$3.20", total: "$3.20" },
    { id: '1', name: "Bananas", qty: "1.2kg", price: "$1.80/kg", total: "$2.16" },
  ];

  const columns: TableColumn<CartItem>[] = [
    { id: "name", header: "Product", accessor: "name", sortable: true },
    { id: "sku", header: "SKU", accessor: "qty" },
    { id: "category", header: "Category", accessor: "price" },
    { id: "stock", header: "Stock", accessor: "total" },
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

                <CustomTable
                  data={cartItems}
                  columns={columns}
                  className="min-w-full overflow-clip rounded-xl border border-gray-500 text-sm"
                  keyExtractor={(row: CartItem) => row.id}
                  // isLoading={isLoading || isFetching}
                  emptyState={
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="mb-4 rounded-full bg-gray-100 p-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mb-1 text-lg font-medium text-gray-900">
                        Add Item for Billing
                      </h3>
                    </div>
                  }
                  pagination={{
                    currentPage: page,
                    pageSize: perPage,
                    totalItems: 0,
                    onPageChange: setPage,
                    onPerPageChange: (newPerPage) => {
                      setPerPage(newPerPage);
                    },
                  }}
                  highlightColumns={["clientName", "primaryEmail"]}
                  // searchedTerm={debouncedSearchTerm}
                />

                {/* <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Item
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Qty
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Price
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Total
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cartItems.length !== 0
                        ? "Add Item for Billing"
                        : cartItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{item.price}</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {item.total}
                              </TableCell>
                              <TableCell>
                                <IconButton size="small">
                                  <Close fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </TableContainer> */}

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
