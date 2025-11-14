import { useEffect, useState } from "react";
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
  Avatar,
  IconButton,
} from "@mui/material";
import {
  Search,
  Add,
  FileDownload,
  People,
  Star,
  ShoppingBag,
  AttachMoney,
  Edit,
  Delete,
  Mail,
  Phone,
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";
import axios from "axios";
import CustomTable from "@/components/CustomTable";
import { sampleCustomers } from "@/data/data";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { TableColumn } from "@/types/common";

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

const statsCards = [
  {
    title: "Total Customers",
    value: "1,847",
    icon: People,
    color: "hsl(var(--primary))",
  },
  {
    title: "Gold Members",
    value: "124",
    icon: Star,
    color: "hsl(38, 92%, 50%)",
  },
  {
    title: "Avg. Purchase",
    value: "$54.20",
    icon: ShoppingBag,
    color: "hsl(var(--success))",
  },
  {
    title: "Lifetime Value",
    value: "$125k",
    icon: AttachMoney,
    color: "hsl(var(--primary))",
  },
];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Gold":
        return { bg: "hsl(38, 92%, 96%)", color: "hsl(38, 92%, 50%)" };
      case "Silver":
        return { bg: "hsl(0, 0%, 94%)", color: "hsl(0, 0%, 40%)" };
      case "Bronze":
        return { bg: "hsl(25, 75%, 96%)", color: "hsl(25, 75%, 50%)" };
      default:
        return {
          bg: "hsl(var(--muted))",
          color: "hsl(var(--muted-foreground))",
        };
    }
  };

  const columns: TableColumn<Customer>[] = [
    {
      id: "customer",
      header: "Customer",
      accessor: "name",
      cell: (value: string, row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {value
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <span className="font-semibold text-gray-900">{value}</span>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      accessor: "email",
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
      id: "tier",
      header: "Tier",
      accessor: "tier",
      cell: (value: Customer["tier"]) => {
        const colors = getTierColor(value);
        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      id: "totalSpent",
      header: "Total Spent",
      accessor: "totalSpent",
      cell: (value: string) => (
        <span className="font-bold text-green-600">{value}</span>
      ),
    },
    {
      id: "visits",
      header: "Visits",
      accessor: "visits",
      cell: (value: number) => (
        <span className="font-semibold text-gray-700">{value}</span>
      ),
    },
    {
      id: "lastVisit",
      header: "Last Visit",
      accessor: "lastVisit",
      cell: (value: string) => <span className="text-gray-600">{value}</span>,
    },
    {
      id: "actions",
      header: "Actions",
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

  useEffect(() => {
    axios
      .get("https://dummyjson.com/users")
      .then((response) => {
        setCustomers(response?.data?.users || []);
        console.log(response?.data?.users);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

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
            Customers
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
                borderRadius: 1,
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                bgcolor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                px: 3,
                py: 1.25,
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "var(--shadow-primary)",
                "&:hover": { bgcolor: "hsl(var(--primary-hover))" },
              }}
            >
              Add Customer
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

        {/* Customers Table */}
        <Card
          sx={{
            bgcolor: "hsl(var(--card))",
            borderRadius: 1,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search customers by name, email, or phone"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "hsl(var(--muted-foreground))" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
              />
            </Box>
            <CustomTable<Customer>
              data={sampleCustomers}
              columns={columns}
              sortable={true}
              onRowClick={(row) => console.log("Row clicked:", row)}
            />

            {/* <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Customer
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Contact
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Tier
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Total Spent
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Visits
                    </TableCell>
                    <TableCell
                      sx={{ color: "hsl(var(--primary))", fontWeight: 600 }}
                    >
                      Last Visit
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => {
                    const tierStyle = getTierColor(customer.tier);
                    const initials = customer.firstName
                      .split(" ")
                      .map((n) => n[0])
                      .join("");

                    return (
                      <TableRow key={customer.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: "hsl(var(--primary))",
                                width: 36,
                                height: 36,
                              }}
                            >
                              {initials}
                            </Avatar>
                            <Typography sx={{ fontWeight: 600 }}>
                              {customer.firstName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {customer.email}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "hsl(var(--muted-foreground))" }}
                          >
                            {customer.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.tier || "Regular"}
                            size="small"
                            sx={{
                              bgcolor: tierStyle.bg,
                              color: tierStyle.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: "hsl(var(--success))" }}
                        >
                          {customer.role}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {customer.visits ?? 0}
                        </TableCell>
                        <TableCell
                          sx={{ color: "hsl(var(--muted-foreground))" }}
                        >
                          {customer.birthDate}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton size="small">
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer> */}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
}
