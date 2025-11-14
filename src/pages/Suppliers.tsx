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
} from '@mui/material';
import {
  Search,
  Add,
  FileDownload,
  LocalShipping,
  CheckCircle,
  Pending,
  AccountBalance,
  Edit,
  Visibility,
} from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  products: string;
  totalOrders: number;
  outstanding: string;
  status: 'active' | 'pending';
}

const suppliersData: Supplier[] = [
  { id: '1', name: 'Fresh Farms Ltd', contact: '+1 234 567 8901', email: 'contact@freshfarms.com', products: 'Dairy, Produce', totalOrders: 145, outstanding: '$2,340', status: 'active' },
  { id: '2', name: 'Bakery Supplies Co', contact: '+1 234 567 8902', email: 'orders@bakerysup.com', products: 'Bakery', totalOrders: 89, outstanding: '$0', status: 'active' },
  { id: '3', name: 'Wholesale Distributors', contact: '+1 234 567 8903', email: 'info@wholesale.com', products: 'Snacks, Beverages', totalOrders: 203, outstanding: '$1,850', status: 'active' },
  { id: '4', name: 'Organic Produce Inc', contact: '+1 234 567 8904', email: 'sales@organic.com', products: 'Produce', totalOrders: 67, outstanding: '$950', status: 'pending' },
];

const statsCards = [
  { title: 'Total Suppliers', value: '24', icon: LocalShipping, color: 'hsl(var(--primary))' },
  { title: 'Active', value: '21', icon: CheckCircle, color: 'hsl(var(--success))' },
  { title: 'Pending', value: '3', icon: Pending, color: 'hsl(var(--warning))' },
  { title: 'Outstanding', value: '$8,450', icon: AccountBalance, color: 'hsl(var(--destructive))' },
];

export default function Suppliers() {
  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Suppliers
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              sx={{
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                bgcolor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                px: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                // boxShadow: 'var(--shadow-primary)',
                // '&:hover': { bgcolor: 'hsl(var(--primary-hover))' },
              }}
            >
              New Supplier
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Grid key={stat.title} xs={12} sm={6} md={3} size={3}>
                <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        {stat.title}
                      </Typography>
                      <Icon sx={{ color: stat.color, fontSize: 24 }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Suppliers Table */}
        <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search suppliers by name or contact"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'hsl(var(--muted-foreground))' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Supplier</TableCell>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Contact</TableCell>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Products</TableCell>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Total Orders</TableCell>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Outstanding</TableCell>
                    <TableCell sx={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Status</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliersData.map((supplier) => {
                    const initials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                    
                    return (
                      <TableRow key={supplier.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'hsl(var(--primary))', width: 36, height: 36 }}>
                              {initials}
                            </Avatar>
                            <Typography sx={{ fontWeight: 600 }}>{supplier.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{supplier.contact}</Typography>
                          <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                            {supplier.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{supplier.products}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{supplier.totalOrders}</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 700,
                          color: supplier.outstanding === '$0' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' 
                        }}>
                          {supplier.outstanding}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={supplier.status}
                            size="small"
                            sx={{
                              bgcolor: supplier.status === 'active' ? 'hsl(142, 71%, 96%)' : 'hsl(38, 92%, 96%)',
                              color: supplier.status === 'active' ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                              fontWeight: 600,
                              textTransform: 'capitalize',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small">
                              <Visibility fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <Edit fontSize="small" />
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
