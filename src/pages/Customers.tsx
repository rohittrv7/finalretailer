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
} from "@mui/icons-material";
import MainLayout from "../components/Layout/MainLayout";
import axios from "axios";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: "Gold" | "Silver" | "Bronze" | "Regular";
  totalSpent: string;
  visits: number;
  lastVisit: string;
}

// const customersData: Customer[] = [
//   {
//     id: "1",
//     name: "Sarah Johnson",
//     email: "sarah.j@email.com",
//     phone: "+1 234 567 8901",
//     tier: "Gold",
//     totalSpent: "$2,450",
//     visits: 45,
//     lastVisit: "Today",
//   },
//   {
//     id: "2",
//     name: "Mike Chen",
//     email: "mike.chen@email.com",
//     phone: "+1 234 567 8902",
//     tier: "Silver",
//     totalSpent: "$1,230",
//     visits: 28,
//     lastVisit: "2 days ago",
//   },
//   {
//     id: "3",
//     name: "Emma Davis",
//     email: "emma.d@email.com",
//     phone: "+1 234 567 8903",
//     tier: "Gold",
//     totalSpent: "$3,150",
//     visits: 62,
//     lastVisit: "Yesterday",
//   },
//   {
//     id: "4",
//     name: "James Wilson",
//     email: "j.wilson@email.com",
//     phone: "+1 234 567 8904",
//     tier: "Bronze",
//     totalSpent: "$540",
//     visits: 12,
//     lastVisit: "1 week ago",
//   },
//   {
//     id: "5",
//     name: "Lisa Anderson",
//     email: "lisa.a@email.com",
//     phone: "+1 234 567 8905",
//     tier: "Regular",
//     totalSpent: "$185",
//     visits: 5,
//     lastVisit: "2 weeks ago",
//   },
// ];

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
        <Grid container spacing={3} sx={{ mb: 4 }} >
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

            <TableContainer>
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
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
}
