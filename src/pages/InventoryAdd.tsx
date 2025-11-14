import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AutoAwesome,
  CameraAlt,
  CloudUpload,
  Info,
  Add as AddIcon,
  Save,
  Refresh,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from '@/hooks/use-toast';
import MainLayout from '../components/Layout/MainLayout';

const categories = ['Grocery', 'Pharmacy', 'Fertilizer', 'Others'];
const units = ['pcs', 'kg', 'ltr', 'box', 'pack', 'bottle'];
const gstRates = ['0%', '5%', '12%', '18%', '28%'];

export default function InventoryAdd() {
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    brand: '',
    sku: generateSKU(),
    barcode: '',
    unit: 'pcs',
    quantity: '',
    reorderLevel: '',
    purchasePrice: '',
    sellingPrice: '',
    mrp: '',
    discount: '',
    gstRate: '18%',
    supplier: '',
    description: '',
    lowStockAlert: true,
  });

  const [purchaseDate, setPurchaseDate] = useState<Dayjs | null>(dayjs());
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function generateSKU() {
    const prefix = 'SKU';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${random}`;
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.productName || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Product name and category are required.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "✅ Product added successfully!",
      description: `${formData.productName} has been added to inventory.`,
    });
  };

  const handleReset = () => {
    setFormData({
      productName: '',
      category: '',
      brand: '',
      sku: generateSKU(),
      barcode: '',
      unit: 'pcs',
      quantity: '',
      reorderLevel: '',
      purchasePrice: '',
      sellingPrice: '',
      mrp: '',
      discount: '',
      gstRate: '18%',
      supplier: '',
      description: '',
      lowStockAlert: true,
    });
    setPurchaseDate(dayjs());
    setExpiryDate(null);
    setImagePreview(null);
  };

  const stockStatus = 
    !formData.quantity ? 'Out of Stock' :
    Number(formData.quantity) < Number(formData.reorderLevel) ? 'Low Stock' :
    'In Stock';

  const stockStatusColor = 
    stockStatus === 'Out of Stock' ? 'hsl(var(--destructive))' :
    stockStatus === 'Low Stock' ? 'hsl(var(--warning))' :
    'hsl(var(--success))';

  return (
    <MainLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                Add New Product
              </Typography>
              <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mt: 0.5 }}>
                Add a new item to your inventory
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleReset}
                sx={{
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                sx={{
                  bgcolor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  px: 3,
                  py: 1.25,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-primary)',
                  '&:hover': { bgcolor: 'hsl(var(--primary-hover))' },
                }}
              >
                Save Product
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              {/* Basic Product Information */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  🧾 Basic Information
                </Typography>
                
                <TextField
                  fullWidth
                  label="Product Name"
                  required
                  value={formData.productName}
                  onChange={(e) => handleChange('productName', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category *"
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Brand (Optional)"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Generate new SKU">
                          <IconButton 
                            size="small"
                            onClick={() => handleChange('sku', generateSKU())}
                          >
                            <AutoAwesome fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Barcode"
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Scan using camera">
                          <IconButton size="small">
                            <CameraAlt fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
              </Paper>

              {/* Stock Details */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  📦 Stock Details
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    label="Unit"
                    onChange={(e) => handleChange('unit', e.target.value)}
                  >
                    {units.map(unit => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Reorder Level"
                  value={formData.reorderLevel}
                  onChange={(e) => handleChange('reorderLevel', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Low stock alert below this level">
                          <Info fontSize="small" sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'hsl(var(--muted))',
                    borderRadius: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Status
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      color: stockStatusColor,
                    }}
                  >
                    {stockStatus}
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.lowStockAlert}
                      onChange={(e) => handleChange('lowStockAlert', e.target.checked)}
                    />
                  }
                  label="Low Stock Alert"
                  sx={{ mt: 2 }}
                />
              </Paper>

              {/* Supplier */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  🏭 Supplier
                </Typography>

                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={formData.supplier}
                    label="Supplier"
                    onChange={(e) => handleChange('supplier', e.target.value)}
                  >
                    <MenuItem value="supplier1">ABC Distributors</MenuItem>
                    <MenuItem value="supplier2">XYZ Wholesale</MenuItem>
                    <MenuItem value="supplier3">Global Supplies Inc.</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{ 
                    mt: 1.5,
                    textTransform: 'none',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  Add New Supplier
                </Button>
              </Paper>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={6}>
              {/* Pricing & Tax */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  💰 Pricing & Tax
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  label="Purchase Price"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange('purchasePrice', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Selling Price"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="MRP"
                  value={formData.mrp}
                  onChange={(e) => handleChange('mrp', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="number"
                  label="Discount %"
                  value={formData.discount}
                  onChange={(e) => handleChange('discount', e.target.value)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth>
                  <InputLabel>GST Rate %</InputLabel>
                  <Select
                    value={formData.gstRate}
                    label="GST Rate %"
                    onChange={(e) => handleChange('gstRate', e.target.value)}
                  >
                    {gstRates.map(rate => (
                      <MenuItem key={rate} value={rate}>{rate}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>

              {/* Dates */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  📅 Dates
                </Typography>

                <DatePicker
                  label="Purchase Date"
                  value={purchaseDate}
                  onChange={(newValue) => setPurchaseDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: { mb: 2 }
                    }
                  }}
                />

                <DatePicker
                  label="Expiry Date (Optional)"
                  value={expiryDate}
                  onChange={(newValue) => setExpiryDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      helperText: "For perishable goods only"
                    }
                  }}
                />
              </Paper>

              {/* Image & Description */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3,
                  bgcolor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(var(--primary))' }}>
                  🖼️ Image & Description
                </Typography>

                <Box
                  sx={{
                    border: '2px dashed hsl(var(--border))',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'hsl(var(--muted))',
                    cursor: 'pointer',
                    mb: 2,
                    position: 'relative',
                    minHeight: 160,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': {
                      borderColor: 'hsl(var(--primary))',
                      bgcolor: 'hsl(var(--primary-light))',
                    }
                  }}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageUpload}
                  />
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: 150,
                        borderRadius: 8,
                      }}
                    />
                  ) : (
                    <>
                      <CloudUpload sx={{ fontSize: 48, color: 'hsl(var(--primary))', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        PNG, JPG up to 10MB
                      </Typography>
                    </>
                  )}
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Add short notes about this product..."
                />
              </Paper>
            </Grid>
          </Grid>

          {/* Last Updated Section */}
          <Box 
            sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'hsl(var(--muted))',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
              Last Updated By: Admin • {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </LocalizationProvider>
    </MainLayout>
  );
}
