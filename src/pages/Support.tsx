import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  List,
  ListItem,
  // ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Chat,
  Email,
  Phone,
  CalendarMonth,
  MenuBook,
  ArrowForward,
  CheckCircle,
  Schedule,
  // Cancel,
} from '@mui/icons-material';
import MainLayout from '../components/Layout/MainLayout';

const helpOptions = [
  {
    icon: Chat,
    title: 'Live chat',
    subtitle: 'Avg. reply: 2 min',
    action: 'Start',
    color: 'hsl(var(--primary))',
  },
  {
    icon: Email,
    title: 'Email',
    subtitle: 'support@retailpro.app',
    action: 'Compose',
    color: 'hsl(var(--success))',
  },
  {
    icon: Phone,
    title: 'Call us',
    subtitle: '9am–6pm local',
    action: '+1 800 555 0149',
    color: 'hsl(var(--warning))',
  },
  {
    icon: CalendarMonth,
    title: 'Book a demo',
    subtitle: 'Personalized walkthrough',
    action: 'Schedule',
    color: 'hsl(211, 100%, 60%)',
  },
];

const popularArticles = [
  'Set up receipt printer',
  'Inventory import guide (CSV)',
  'Resolve barcode scan issues',
];

const recentTickets = [
  {
    id: 'TCK-4321',
    subject: "POS drawer won't open",
    status: 'pending',
    updated: '1h ago',
    assignedTo: 'Maya',
  },
  {
    id: 'TCK-4187',
    subject: 'Incorrect tax on items',
    status: 'resolved',
    updated: '2d ago',
    assignedTo: 'Sam',
  },
];

export default function Support() {
  return (
    <MainLayout>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'hsl(var(--foreground))' }}>
            Contact & Support
          </Typography>
          <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Get help from our support team
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Create Support Ticket */}
          <Grid xs={12} md={7}>
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'hsl(var(--foreground))' }}>
                  Create a support ticket
                </Typography>
                <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mb: 3 }}>
                  Tell us what you need help with. Our team typically responds within 2 hours.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Subject"
                    placeholder="e.g., POS freezes when scanning barcode"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />

                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      defaultValue="billing"
                      label="Category"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="billing">Billing / POS</MenuItem>
                      <MenuItem value="inventory">Inventory</MenuItem>
                      <MenuItem value="technical">Technical Issue</MenuItem>
                      <MenuItem value="feature">Feature Request</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      defaultValue="high"
                      label="Priority"
                      sx={{ borderRadius: 1 }}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    placeholder="The POS app becomes unresponsive after scanning the third item. We've tried restarting. Please advise."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AttachFile />}
                      sx={{
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 1,
                      }}
                    >
                      Add attachment
                    </Button>
                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', alignSelf: 'center' }}>
                      Max 10MB • PNG, JPG, PDF
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--foreground))',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 1,
                        px: 3,
                      }}
                    >
                      Preview Ticket
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary-foreground))',
                        px: 4,
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: 'var(--shadow-primary)',
                        '&:hover': { bgcolor: 'hsl(var(--primary-hover))' },
                      }}
                    >
                      Send Ticket
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Your Recent Tickets */}
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'hsl(var(--foreground))' }}>
                  Your recent tickets
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentTickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      sx={{
                        bgcolor: ticket.status === 'pending' ? 'hsl(38, 92%, 97%)' : 'hsl(142, 71%, 97%)',
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: ticket.status === 'pending' ? 'hsl(38, 92%, 90%)' : 'hsl(142, 71%, 90%)',
                        borderRadius: 1,
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>
                              #{ticket.id}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
                              {ticket.subject}
                            </Typography>
                          </Box>
                          <Chip
                            icon={ticket.status === 'pending' ? <Schedule /> : <CheckCircle />}
                            label={ticket.status === 'pending' ? 'Awaiting your reply' : 'Resolved'}
                            size="small"
                            sx={{
                              bgcolor: ticket.status === 'pending' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                          Last updated {ticket.updated} • Assigned to: {ticket.assignedTo}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Help Options & Resources */}
          <Grid xs={12} md={5}>
            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'hsl(var(--foreground))' }}>
                  Help options
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {helpOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Box
                        key={option.title}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          bgcolor: 'hsl(var(--muted))',
                          borderRadius: 1,
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          '&:hover': {
                            bgcolor: 'hsl(var(--primary-light))',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: 'white',
                            borderRadius: 1,
                            display: 'flex',
                          }}
                        >
                          <Icon sx={{ color: option.color, fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {option.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                            {option.subtitle}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="text"
                          sx={{
                            color: 'hsl(var(--primary))',
                            textTransform: 'none',
                            fontWeight: 600,
                          }}
                        >
                          {option.action}
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'hsl(var(--card))', borderRadius: 1, boxShadow: 'var(--shadow-md)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <MenuBook sx={{ color: 'hsl(var(--primary))' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                    Popular articles
                  </Typography>
                </Box>
                <List>
                  {popularArticles.map((article, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        px: 0,
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiTypography-root': {
                            color: 'hsl(var(--primary))',
                          },
                        },
                      }}
                      secondaryAction={
                        <IconButton edge="end" size="small">
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={article} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'hsl(var(--primary-light))', borderRadius: 1, border: '2px solid hsl(var(--primary))' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'hsl(var(--primary))' }}>
                  System status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircle sx={{ color: 'hsl(var(--success))', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    All systems operational
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
