import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  // Table,
  // TableBody,
  // TableCell,
  // TableContainer,
  // TableHead,
  // TableRow,
  // Paper,
  // IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  TrendingUp,
  Receipt,
  Assessment,
  Add,
  Warning,
  Schedule,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SalesOverviewCard from "@/components/Graph/SalesOverviewCard";
import MainLayout from "@/components/Layout/MainLayout";
import { quickActions, topCategories, topProducts } from "@/data/data";

const statsCards = [
  {
    title: "Today's Sales",
    value: "$8,420",
    change: "+12% vs yesterday",
    badge: "Live",
    icon: TrendingUp,
    color: "hsl(var(--primary))",
  },
  {
    title: "Profit",
    value: "$2,310",
    subtitle: "Margin 27.4%",
    icon: Assessment,
    color: "hsl(var(--success))",
  },
  {
    title: "Orders",
    value: "156",
    subtitle: "Avg basket $54",
    icon: Receipt,
    color: "hsl(var(--warning))",
  },
  {
    title: "Stock Alerts",
    value: "18 items",
    subtitle: "5 expiring soon",
    icon: Warning,
    color: "hsl(var(--destructive))",
  },
];

const lowStockItems = [
  { name: "Milk 1L", quantity: "3 left", status: "critical", icon: Warning },
  {
    name: "Yogurt Pack",
    quantity: "Expiry 5 days",
    status: "warning",
    icon: Schedule,
  },
  {
    name: "AA Batteries",
    quantity: "7 left",
    status: "critical",
    icon: Warning,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
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
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
            >
              Dashboard
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
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
            New Invoice
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid
          container
          spacing={3}
          sx={{ mb: 4 }}
          className="grid grid-cols-3 border-red-500"
        >
          {statsCards.map((stat) => {
            // const Icon = stat.icon;
            return (
              <Grid item key={stat.title} xs={12} sm={6} md={3} size={3}>
                <Card
                  sx={{
                    bgcolor: "hsl(var(--card))",
                    borderRadius: 1,
                    boxShadow: "var(--shadow-md)",
                    transition: "var(--transition-smooth)",
                    "&:hover": {
                      boxShadow: "var(--shadow-lg)",
                      transform: "translateY(0px)",
                    },
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
                      {stat.badge && (
                        <Chip
                          label={stat.badge}
                          size="small"
                          sx={{
                            bgcolor: "hsl(var(--success))",
                            color: "hsl(var(--success-foreground))",
                            fontWeight: 600,
                            fontSize: 11,
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 1,
                        color: "hsl(var(--foreground))",
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "hsl(var(--muted-foreground))" }}
                    >
                      {stat.change || stat.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={3}>
          {/* Sales Overview */}
          <SalesOverviewCard />
          {/* <Grid xs={12} md={8} size={8}>
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
                    Sales Overview
                  </Typography>
                  <IconButton size="small">
                    <FileDownload />
                  </IconButton>
                </Box>
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "hsl(var(--primary-light))",
                    borderRadius: 1,
                    color: "hsl(var(--primary))",
                  }}
                >
                  <Typography variant="body2">[Chart Placeholder]</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}

          {/* Low Stock & Expiry */}
          <Grid xs={12} md={4} size={4}>
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
                  Low Stock & Expiry
                </Typography>
                {lowStockItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        mb: 1.5,
                        bgcolor:
                          item.status === "critical"
                            ? "hsl(0, 84%, 97%)"
                            : "hsl(38, 92%, 97%)",
                        borderRadius: 2,
                      }}
                    >
                      <Icon
                        sx={{
                          color:
                            item.status === "critical"
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--warning))",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "hsl(var(--foreground))",
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {item.quantity}
                        </Typography>
                      </Box>
                      <Chip
                        label={item.quantity.split(" ")[0]}
                        size="small"
                        sx={{
                          bgcolor:
                            item.status === "critical"
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--warning))",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  );
                })}
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

          {/* Quick Actions */}
          <Grid xs={12} md={8}>
            <Grid container spacing={2}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Grid key={action.title} xs={12} sm={6} size={6}>
                    <Card
                      onClick={() => navigate(action.path)}
                      sx={{
                        bgcolor: "hsl(var(--card))",
                        borderRadius: 1,
                        boxShadow: "var(--shadow-sm)",
                        cursor: "pointer",
                        transition: "var(--transition-smooth)",
                        "&:hover": {
                          boxShadow: "var(--shadow-md)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "start", gap: 2 }}
                        >
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: "hsl(var(--primary-light))",
                              borderRadius: 2,
                              display: "flex",
                            }}
                          >
                            <Icon
                              sx={{
                                color: "hsl(var(--primary))",
                                fontSize: 24,
                              }}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 700,
                                mb: 0.5,
                                color: "hsl(var(--foreground))",
                              }}
                            >
                              {action.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "hsl(var(--muted-foreground))" }}
                            >
                              {action.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          {/* Quick POS */}
          {/* <Grid xs={12} md={4}>
            <Card
              sx={{
                bgcolor: "hsl(var(--card))",
                borderRadius: 1,
                boxShadow: "var(--shadow-md)",
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
                  Quick POS
                </Typography>
                <TableContainer>
                  <Table size="small">
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
                          Qty
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          Price
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                        >
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quickPosItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.price}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {item.total}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: "1px solid hsl(var(--border))",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">Subtotal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      $10.36
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2">Tax</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      $0.83
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      $11.19
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Receipt />}
                    sx={{
                      bgcolor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: "hsl(var(--primary-hover))",
                      },
                    }}
                  >
                    Pay & Print
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid> */}
        </Grid>
      </Box>
    </MainLayout>
  );
}
