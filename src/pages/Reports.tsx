import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  FileDownload,
  Print,
  TrendingUp,
  Assessment,
  ShoppingCart,
  TrendingDown,
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";

const salesMetrics = [
  {
    title: "Total Sales",
    value: "$48,320",
    change: "+12% vs prev",
    trending: "up",
    icon: TrendingUp,
  },
  {
    title: "Gross Profit",
    value: "$14,760",
    change: "+8% vs prev",
    trending: "up",
    icon: Assessment,
  },
  {
    title: "Avg. Order Value",
    value: "$28.40",
    change: "+3% vs prev",
    trending: "up",
    icon: ShoppingCart,
  },
  {
    title: "Refund Rate",
    value: "1.6%",
    change: "-0.2pp vs prev",
    trending: "down",
    icon: TrendingDown,
  },
];

const topCategories = [
  { category: "Dairy", sales: "$12,300", profit: "$3,540", margin: "28.8%" },
  { category: "Produce", sales: "$9,420", profit: "$2,260", margin: "24.0%" },
  { category: "Bakery", sales: "$7,880", profit: "$1,960", margin: "24.9%" },
  { category: "Snacks", sales: "$6,210", profit: "$1,310", margin: "21.1%" },
];

const topProducts = [
  { product: "Milk 1L", units: 1240, revenue: "$1,736" },
  { product: "Eggs (12)", units: 980, revenue: "$3,136" },
  { product: "Bread Loaf", units: 860, revenue: "$2,150" },
  { product: "Bananas", units: 745, revenue: "$1,341" },
];

const lowStockAlerts = [
  { item: "Chocolate Bar", inStock: 12, reorder: 50 },
  { item: "Butter 200g", inStock: 8, reorder: 30 },
  { item: "Apples", inStock: "15kg", reorder: "40kg" },
];

export default function Reports() {
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
            Reports
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select defaultValue="Last 30 days" sx={{ borderRadius: 2 }}>
                <MenuItem value="Last 7 days">Last 7 days</MenuItem>
                <MenuItem value="Last 30 days">Last 30 days</MenuItem>
                <MenuItem value="Last 90 days">Last 90 days</MenuItem>
                <MenuItem value="This year">This year</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Print />}
              sx={{
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownload />}
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
              Export
            </Button>
          </Box>
        </Box>

        {/* Sales Metrics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {salesMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Grid key={metric.title} xs={12} sm={6} md={3} size={3}>
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
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "hsl(var(--muted-foreground))" }}
                      >
                        {metric.title}
                      </Typography>
                      <Chip
                        label={
                          metric.change.includes("+")
                            ? metric.change
                            : metric.change
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            metric.trending === "up"
                              ? "hsl(142, 71%, 96%)"
                              : "hsl(38, 92%, 96%)",
                          color:
                            metric.trending === "up"
                              ? "hsl(var(--success))"
                              : "hsl(var(--warning))",
                          fontWeight: 600,
                          fontSize: 11,
                          height: 22,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
                    >
                      {metric.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          {/* Sales Overview Chart */}
          <Grid xs={12} md={8} size={8}>
            <Card
              sx={{
                bgcolor: "hsl(var(--card))",
                borderRadius: 1,
                boxShadow: "var(--shadow-md)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    color: "hsl(var(--foreground))",
                  }}
                >
                  Sales Overview
                </Typography>
                <Box
                  sx={{
                    height: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "hsl(var(--primary-light))",
                    borderRadius: 2,
                    color: "hsl(var(--primary))",
                  }}
                >
                  <Typography variant="body2">
                    [Area/Line Chart Placeholder]
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alerts */}
          <Grid xs={12} md={6} size={4}>
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
                    Low Stock Alerts
                  </Typography>
                  <Chip
                    label="Critical"
                    size="small"
                    sx={{
                      bgcolor: "hsl(0, 84%, 96%)",
                      color: "hsl(var(--destructive))",
                    }}
                  />
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          Item
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          In Stock
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          Reorder
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockAlerts.map((alert) => (
                        <TableRow key={alert.item}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {alert.item}
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "hsl(var(--destructive))",
                              fontWeight: 700,
                            }}
                          >
                            {alert.inStock}
                          </TableCell>
                          <TableCell>{alert.reorder}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Categories */}
          <Grid xs={12} md={4} size={6}>
            <Card
              sx={{
                bgcolor: "hsl(var(--card))",
                borderRadius: 1,
                boxShadow: "var(--shadow-md)",
                height: "100%",
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
                    Top Categories
                  </Typography>
                  <Chip
                    label="Revenue"
                    size="small"
                    sx={{
                      bgcolor: "hsl(var(--primary-light))",
                      color: "hsl(var(--primary))",
                    }}
                  />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Category
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Sales
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Profit
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "hsl(var(--primary))",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          Margin
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topCategories.map((cat) => (
                        <TableRow key={cat.category}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {cat.category}
                          </TableCell>
                          <TableCell>{cat.sales}</TableCell>
                          <TableCell sx={{ color: "hsl(var(--success))" }}>
                            {cat.profit}
                          </TableCell>
                          <TableCell>{cat.margin}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Products */}
          <Grid xs={12} md={6} size={6}>
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
                    Top Products
                  </Typography>
                  <Chip
                    label="Units Sold"
                    size="small"
                    sx={{
                      bgcolor: "hsl(var(--primary-light))",
                      color: "hsl(var(--primary))",
                    }}
                  />
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
                          Units
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          Revenue
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.product}>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {product.product}
                          </TableCell>
                          <TableCell>
                            {product.units.toLocaleString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              color: "hsl(var(--success))",
                            }}
                          >
                            {product.revenue}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
