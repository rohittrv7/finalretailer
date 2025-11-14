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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  // Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Add,
  FileDownload,
  MoreVert,
  Edit,
  Delete,
  Inventory2,
  Warning,
  TrendingUp,
  TrendingDown,
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";
import { toast } from "@/hooks/use-toast";
import { InventoryItem } from "@/types/inventoryItems";
import { useNavigate } from "react-router-dom";

interface InventoryListItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorder: number;
  price: string;
  status: "in-stock" | "low" | "out";
  movement: "up" | "down";
}

const inventoryData: InventoryListItem[] = [
  {
    id: "1",
    name: "Milk 1L",
    sku: "MK-1L",
    category: "Dairy",
    stock: 25,
    reorder: 50,
    price: "$1.40",
    status: "low",
    movement: "down",
  },
  {
    id: "2",
    name: "Bread Loaf",
    sku: "BR-001",
    category: "Bakery",
    stock: 42,
    reorder: 30,
    price: "$2.50",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "3",
    name: "Eggs (12)",
    sku: "EG-012",
    category: "Dairy",
    stock: 18,
    reorder: 20,
    price: "$3.20",
    status: "low",
    movement: "down",
  },
  {
    id: "4",
    name: "Chocolate Bar",
    sku: "CH-099",
    category: "Snacks",
    stock: 120,
    reorder: 50,
    price: "$0.99",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "5",
    name: "Apples",
    sku: "AP-210",
    category: "Produce",
    stock: 0,
    reorder: 40,
    price: "$2.10/kg",
    status: "out",
    movement: "down",
  },
  {
    id: "6",
    name: "Orange Juice",
    sku: "OJ-500",
    category: "Beverages",
    stock: 35,
    reorder: 25,
    price: "$3.50",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "7",
    name: "Rice 5kg",
    sku: "RC-5KG",
    category: "Grocery",
    stock: 12,
    reorder: 15,
    price: "$8.99",
    status: "low",
    movement: "down",
  },
  {
    id: "8",
    name: "Tomatoes",
    sku: "TM-001",
    category: "Produce",
    stock: 55,
    reorder: 30,
    price: "$2.50/kg",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "9",
    name: "Pasta",
    sku: "PS-500",
    category: "Grocery",
    stock: 0,
    reorder: 20,
    price: "$1.99",
    status: "out",
    movement: "down",
  },
  {
    id: "10",
    name: "Coffee Beans",
    sku: "CF-250",
    category: "Beverages",
    stock: 28,
    reorder: 15,
    price: "$12.99",
    status: "in-stock",
    movement: "up",
  },
  {
    id: "11",
    name: "Chicken Breast",
    sku: "CK-1KG",
    category: "Meat",
    stock: 8,
    reorder: 10,
    price: "$9.99/kg",
    status: "low",
    movement: "down",
  },
  {
    id: "12",
    name: "Butter 500g",
    sku: "BT-500",
    category: "Dairy",
    stock: 45,
    reorder: 25,
    price: "$4.50",
    status: "in-stock",
    movement: "up",
  },
];

const statsCards = [
  {
    title: "Total Items",
    value: "1,247",
    icon: Inventory2,
    color: "hsl(var(--primary))",
  },
  {
    title: "Low Stock",
    value: "23",
    icon: Warning,
    color: "hsl(var(--warning))",
  },
  {
    title: "Out of Stock",
    value: "5",
    icon: Warning,
    color: "hsl(var(--destructive))",
  },
  {
    title: "Stock Value",
    value: "$45,320",
    icon: TrendingUp,
    color: "hsl(var(--success))",
  },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryListItem | null>(
    null
  );
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inventoryList, setInventoryList] =
    useState<InventoryListItem[]>(inventoryData);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (item: InventoryListItem) => {
    const editItem: InventoryItem = {
      id: item.id,
      productName: item.name,
      category: item.category,
      sku: item.sku,
      unit: "pcs",
      quantity: item.stock,
      reorderLevel: item.reorder,
      sellingPrice: parseFloat(item.price.replace("$", "").replace("/kg", "")),
      purchasePrice: 0,
      mrp: 0,
      gstRate: "18%",
      lowStockAlert: true,
    };
    setEditData(editItem);
    setOpenAddModal(true);
    setAnchorEl(null);
  };

  const handleDelete = (item: InventoryListItem) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
    setAnchorEl(null);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      setInventoryList(
        inventoryList.filter((item) => item.id !== selectedItem.id)
      );
      toast({
        title: "Product deleted",
        description: `${selectedItem.name} has been removed from inventory.`,
      });
    }
    setOpenDeleteDialog(false);
    setSelectedItem(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return { bg: "hsl(142, 71%, 96%)", color: "hsl(var(--success))" };
      case "low":
        return { bg: "hsl(38, 92%, 96%)", color: "hsl(var(--warning))" };
      case "out":
        return { bg: "hsl(0, 84%, 96%)", color: "hsl(var(--destructive))" };
      default:
        return {
          bg: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low":
        return "Low Stock";
      case "out":
        return "Out of Stock";
      default:
        return status;
    }
  };

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
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
          >
            Inventory
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              sx={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/inventory/add")}
              // onClick={() => {
              //   setEditData(null);
              //   setOpenAddModal(true);
              // }}
              sx={{
                bgcolor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                px: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "var(--shadow-primary)",
                "&:hover": { bgcolor: "hsl(var(--primary-hover))" },
              }}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid key={stat.title} xs={12} sm={6} md={3} size={3}>
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
                        alignItems: "start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {stat.title}
                      </Typography>
                      <Icon sx={{ color: stat.color, fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
                    >
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Inventory Table */}
        <Card
          sx={{
            bgcolor: "hsl(var(--card))",
            borderRadius: 1,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search products, SKU or barcode"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{ color: "hsl(var(--muted-foreground))" }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Product
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      SKU
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Category
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Stock
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Reorder Point
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Price
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Movement
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryList
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item) => {
                      const statusStyle = getStatusColor(item.status);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {item.name}
                          </TableCell>
                          <TableCell sx={{ color: "hsl(var(--primary))" }}>
                            {item.sku}
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {item.stock}
                          </TableCell>
                          <TableCell
                            sx={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {item.reorder}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {item.price}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(item.status)}
                              size="small"
                              sx={{
                                bgcolor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 600,
                                fontSize: 12,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {item.movement === "up" ? (
                              <TrendingUp
                                sx={{ color: "hsl(var(--success))" }}
                              />
                            ) : (
                              <TrendingDown
                                sx={{ color: "hsl(var(--destructive))" }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                setSelectedItem(item);
                                setAnchorEl(e.currentTarget);
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={inventoryList.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                borderTop: "1px solid hsl(var(--border))",
                "& .MuiTablePagination-toolbar": {
                  color: "hsl(var(--foreground))",
                },
              }}
            />
          </CardContent>
        </Card>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => {
            setAnchorEl(null);
            setSelectedItem(null);
          }}
        >
          <MenuItem onClick={() => selectedItem && handleEdit(selectedItem)}>
            <Edit sx={{ mr: 1, fontSize: 18 }} /> Edit
          </MenuItem>
          <MenuItem
            onClick={() => selectedItem && handleDelete(selectedItem)}
            sx={{ color: "hsl(var(--destructive))" }}
          >
            <Delete sx={{ mr: 1, fontSize: 18 }} /> Delete
          </MenuItem>
        </Menu>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
          PaperProps={{
            sx: {
              borderRadius: 1,
              bgcolor: "hsl(var(--background))",
              boxShadow: "var(--shadow-lg)",
            },
          }}
        >
          <DialogTitle
            sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
          >
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: "hsl(var(--muted-foreground))" }}>
              Are you sure you want to delete{" "}
              <strong>{selectedItem?.name}</strong>? This action cannot be
              undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button
              onClick={() => setOpenDeleteDialog(false)}
              variant="outlined"
              sx={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              sx={{
                bgcolor: "hsl(var(--destructive))",
                color: "white",
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "hsl(var(--destructive) / 0.9)" },
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
