import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  CameraAlt,
  CloudUpload,
  Info,
  Add as AddIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { toast } from '@/hooks/use-toast';

interface AddInventoryModalProps {
  open: boolean;
  onClose: () => void;
  editData?: InventoryItem | null;
  onSave?: (data: any) => void;
}

export interface InventoryItem {
  id?: string;
  productName: string;
  category: string;
  brand?: string;
  sku: string;
  barcode?: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  discount?: number;
  gstRate: string;
  supplier?: string;
  description?: string;
  lowStockAlert: boolean;
  purchaseDate?: string;
  expiryDate?: string;
  imageUrl?: string;
}

const categories = ['Grocery', 'Pharmacy', 'Fertilizer', 'Others'];
const units = ['pcs', 'kg', 'ltr', 'box', 'pack', 'bottle'];
const gstRates = ['0%', '5%', '12%', '18%', '28%'];

export default function AddInventoryModal({ open, onClose, editData, onSave }: AddInventoryModalProps) {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load edit data when modal opens
  useState(() => {
    if (editData && open) {
      setFormData({
        productName: editData.productName || '',
        category: editData.category || '',
        brand: editData.brand || '',
        sku: editData.sku || generateSKU(),
        barcode: editData.barcode || '',
        unit: editData.unit || 'pcs',
        quantity: editData.quantity?.toString() || '',
        reorderLevel: editData.reorderLevel?.toString() || '',
        purchasePrice: editData.purchasePrice?.toString() || '',
        sellingPrice: editData.sellingPrice?.toString() || '',
        mrp: editData.mrp?.toString() || '',
        discount: editData.discount?.toString() || '',
        gstRate: editData.gstRate || '18%',
        supplier: editData.supplier || '',
        description: editData.description || '',
        lowStockAlert: editData.lowStockAlert ?? true,
      });
      if (editData.purchaseDate) {
        setPurchaseDate(dayjs(editData.purchaseDate));
      }
      if (editData.expiryDate) {
        setExpiryDate(dayjs(editData.expiryDate));
      }
      if (editData.imageUrl) {
        setImagePreview(editData.imageUrl);
      }
    }
  });

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.quantity || Number(formData.quantity) < 0) {
      newErrors.quantity = "Valid quantity is required";
    }
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = "Valid selling price is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      ...formData,
      id: editData?.id,
      quantity: Number(formData.quantity),
      reorderLevel: Number(formData.reorderLevel),
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      mrp: Number(formData.mrp),
      discount: formData.discount ? Number(formData.discount) : 0,
      purchaseDate: purchaseDate?.toISOString(),
      expiryDate: expiryDate?.toISOString(),
      imageUrl: imagePreview,
    };

    if (onSave) {
      onSave(dataToSave);
    }

    toast({
      title: editData ? "✅ Product updated successfully!" : "✅ Product added successfully!",
      description: `${formData.productName} has been ${editData ? 'updated' : 'added to inventory'}.`,
    });
    
    handleReset();
    onClose();
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
    setErrors({});
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'hsl(var(--background))',
            boxShadow: 'var(--shadow-lg)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--border))',
          pb: 2,
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            {editData ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
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
                error={!!errors.productName}
                helperText={errors.productName}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.category}>
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
                {errors.category && (
                  <Typography variant="caption" sx={{ color: 'hsl(var(--destructive))', mt: 0.5, ml: 1.5 }}>
                    {errors.category}
                  </Typography>
                )}
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
                label="Quantity *"
                required
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                error={!!errors.quantity}
                helperText={errors.quantity}
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
                label="Selling Price *"
                required
                value={formData.sellingPrice}
                onChange={(e) => handleChange('sellingPrice', e.target.value)}
                error={!!errors.sellingPrice}
                helperText={errors.sellingPrice}
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
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleReset}
          variant="outlined"
          sx={{
            borderColor: 'hsl(var(--border))',
            color: 'hsl(var(--foreground))',
            textTransform: 'none',
            px: 3,
            borderRadius: 2,
          }}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'var(--shadow-primary)',
            '&:hover': { bgcolor: 'hsl(var(--primary-hover))' },
          }}
        >
          {editData ? 'Update Product' : 'Save Product'}
        </Button>
      </DialogActions>
    </Dialog>
    </LocalizationProvider>
  );
}
