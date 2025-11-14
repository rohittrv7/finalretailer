import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Store,
  Notifications,
  Security,
  Receipt,
  Palette,
  Language,
  Save,
  Edit,
} from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

const settingsSections = [
  {
    icon: Store,
    title: 'Store Profile',
    description: 'Manage your store information and branding',
  },
  {
    icon: Receipt,
    title: 'Taxes & Billing',
    description: 'Configure tax rates and invoice settings',
  },
  {
    icon: Notifications,
    title: 'Notifications',
    description: 'Control email and system notifications',
  },
  {
    icon: Security,
    title: 'Security & Users',
    description: 'Roles, permissions, and access control',
  },
];

export default function Settings() {
  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mt: 1 }}>
            Manage your store settings and preferences
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Quick Settings Cards */}
          <Grid xs={12} md={8}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <Grid key={section.title} xs={12} sm={6}>
                    <Card
                      sx={{
                        bgcolor: 'hsl(var(--card))',
                        borderRadius: 1,
                        boxShadow: 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)',
                        '&:hover': {
                          boxShadow: 'var(--shadow-md)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: 'hsl(var(--primary-light))',
                              borderRadius: 2,
                              display: 'flex',
                            }}
                          >
                            <Icon sx={{ color: 'hsl(var(--primary))', fontSize: 24 }} />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {section.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                              {section.description}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Store Information */}
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'hsl(var(--foreground))' }}>
                  Store Information
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Store Name"
                      defaultValue="RetailPro Mart"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Contact Email"
                      defaultValue="contact@retailpro.com"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      defaultValue="+1 234 567 8900"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Tax ID"
                      defaultValue="TAX-123456789"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      defaultValue="123 Market St, Springfield"
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'hsl(var(--foreground))' }}>
                  Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Email notifications for low stock"
                  />
                  <Divider />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Send daily sales reports"
                  />
                  <Divider />
                  <FormControlLabel
                    control={<Switch />}
                    label="Enable customer loyalty program"
                  />
                  <Divider />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Auto-generate purchase orders"
                  />
                  <Divider />
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Show stock alerts on dashboard"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Profile & Actions */}
          <Grid xs={12} md={4}>
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'hsl(var(--foreground))' }}>
                  Your Profile
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'hsl(var(--primary))',
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    AC
                  </Avatar>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Alex Carter
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                      Store Manager
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                      alex@retailpro.app
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    sx={{
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'hsl(var(--foreground))' }}>
                  System Settings
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Language sx={{ color: 'hsl(var(--primary))' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Language</Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        English (US)
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Palette sx={{ color: 'hsl(var(--primary))' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Theme</Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        Light Mode
                      </Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Receipt sx={{ color: 'hsl(var(--primary))' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Currency</Typography>
                      <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                        USD ($)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Button
              fullWidth
              variant="contained"
              startIcon={<Save />}
              sx={{
                bgcolor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                py: 1.75,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 16,
                boxShadow: 'var(--shadow-primary)',
                '&:hover': { bgcolor: 'hsl(var(--primary-hover))' },
              }}
            >
              Save Changes
            </Button>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
