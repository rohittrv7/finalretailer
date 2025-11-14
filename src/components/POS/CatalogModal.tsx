import axios from "axios";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  IconButton,
  // Chip,
  MenuItem,
  Select,
  FormControl,
  Pagination,
} from "@mui/material";
import {
  Search,
  Close,
  Add,
  Category,
  Inventory2,
  FileUpload,
} from "@mui/icons-material";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number | string;
  image: string;
}

// const products: Product[] = [
//   {
//     id: "1",
//     name: "Bread Loaf",
//     sku: "BR-001",
//     price: "$2.50",
//     stock: 42,
//     image: "/placeholder.svg",
//   },
//   {
//     id: "2",
//     name: "Eggs (12)",
//     sku: "EG-012",
//     price: "$3.20",
//     stock: 18,
//     image: "/placeholder.svg",
//   },
//   {
//     id: "3",
//     name: "Bananas",
//     sku: "BN-100",
//     price: "$1.80/kg",
//     stock: "65kg",
//     image: "/placeholder.svg",
//   },
//   {
//     id: "4",
//     name: "Milk 1L",
//     sku: "MK-1L",
//     price: "$1.40",
//     stock: 25,
//     image: "/placeholder.svg",
//   },
//   {
//     id: "5",
//     name: "Chocolate Bar",
//     sku: "CH-099",
//     price: "$0.99",
//     stock: 120,
//     image: "/placeholder.svg",
//   },
//   {
//     id: "6",
//     name: "Apples",
//     sku: "AP-210",
//     price: "$2.10/kg",
//     stock: "40kg",
//     image: "/placeholder.svg",
//   },
// ];

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CatalogModal({ open, onClose }: CatalogModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("In stock");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get("https://dummyjson.com/products")
      .then((response) => {
        setProducts(response?.data?.products || []);
        console.log(response?.data?.products);
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Add Items to Sale
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FileUpload />}
              size="small"
              sx={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Import
            </Button>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search products, SKU or barcode"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "hsl(var(--muted-foreground))" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
            </Grid>
            <Grid xs={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <Category
                        sx={{ color: "hsl(var(--muted-foreground))", ml: 0.5 }}
                      />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="All">Category: All</MenuItem>
                  <MenuItem value="Dairy">Dairy</MenuItem>
                  <MenuItem value="Produce">Produce</MenuItem>
                  <MenuItem value="Bakery">Bakery</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  displayEmpty
                  startAdornment={
                    <InputAdornment position="start">
                      <Inventory2
                        sx={{ color: "hsl(var(--muted-foreground))", ml: 0.5 }}
                      />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="In stock">Stock: In stock</MenuItem>
                  <MenuItem value="Low stock">Low stock</MenuItem>
                  <MenuItem value="Out of stock">Out of stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {products?.map((product) => (
            <Grid key={product.id} xs={12} sm={6} md={4} size={3}>
              <Card
                sx={{
                  bgcolor: "hsl(var(--card))",
                  borderRadius: 1,
                  boxShadow: "var(--shadow-sm)",
                  transition: "var(--transition-smooth)",
                  "&:hover": {
                    boxShadow: "var(--shadow-md)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="100"
                  image={product.thumbnail}
                  alt={product.thumbnail}
                  sx={{ bgcolor: "hsl(var(--muted))" }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, mb: 0.5, fontSize: 16 }}
                    >
                      {product.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "hsl(var(--primary))",
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      SKU {product.sku}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "hsl(var(--foreground))",
                        }}
                      >
                        ${product.price}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        Stock: {product.stock}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Add />}
                    sx={{
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "hsl(var(--primary))",
                        bgcolor: "hsl(var(--primary-light))",
                        color: "hsl(var(--primary))",
                      },
                    }}
                  >
                    Add
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={3} color="primary" />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
