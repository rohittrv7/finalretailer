import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Collapse,
} from "@mui/material";
import {
  Dashboard,
  PointOfSale,
  Inventory,
  People,
  LocalShipping,
  Settings,
  AttachMoney,
  Support,
  ShoppingBag,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  List as ListIcon,
} from "@mui/icons-material";
import ThemeToggle from "../ThemeToggle";

const drawerWidth = 240;

const menuItems = [
  { icon: Dashboard, label: "Dashboard", path: "/" },
  { icon: PointOfSale, label: "Billing (POS)", path: "/pos" },
  {
    icon: Inventory,
    label: "Inventory",
    path: "/inventory",
    children: [
      { icon: AddIcon, label: "Add Inventory", path: "/inventory/add" },
      { icon: ListIcon, label: "Listing", path: "/inventory" },
    ],
  },
  { icon: People, label: "Customers", path: "/customers" },
  { icon: LocalShipping, label: "Suppliers", path: "/suppliers" },
  // { icon: Assessment, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: AttachMoney, label: "Pricing", path: "/pricing" },
  { icon: Support, label: "Contact/Support", path: "/support" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  // const [searchQuery, setSearchQuery] = useState("");
  const [inventoryOpen, setInventoryOpen] = useState(
    location.pathname.startsWith("/inventory")
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "hsl(var(--sidebar-background))",
          borderRight: "1px solid hsl(var(--sidebar-border))",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ShoppingBag sx={{ color: "hsl(var(--primary))", fontSize: 32 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "hsl(var(--foreground))" }}
          >
            RetailPro
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.5, flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.children
            ? location.pathname.startsWith("/inventory")
            : location.pathname === item.path;
          const hasChildren = item.children && item.children.length > 0;

          return (
            <Box key={item.path}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    if (hasChildren) {
                      setInventoryOpen(!inventoryOpen);
                    } else {
                      navigate(item.path);
                    }
                  }}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    bgcolor: isActive
                      ? "hsl(var(--sidebar-accent))"
                      : "transparent",
                    color: isActive
                      ? "hsl(var(--sidebar-accent-foreground))"
                      : "hsl(var(--sidebar-foreground))",
                    "&:hover": {
                      bgcolor: isActive
                        ? "hsl(var(--sidebar-accent))"
                        : "hsl(var(--muted))",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Icon sx={{ color: "inherit", fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                  {hasChildren &&
                    (inventoryOpen ? <ExpandLess /> : <ExpandMore />)}
                </ListItemButton>
              </ListItem>

              {/* Children items */}
              {hasChildren && (
                <Collapse in={inventoryOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path;

                      return (
                        <ListItem
                          key={child.path}
                          disablePadding
                          sx={{ mb: 0.5 }}
                        >
                          <ListItemButton
                            onClick={() => navigate(child.path)}
                            sx={{
                              borderRadius: 2,
                              py: 1,
                              pl: 7,
                              bgcolor: isChildActive
                                ? "hsl(var(--sidebar-accent))"
                                : "transparent",
                              color: isChildActive
                                ? "hsl(var(--sidebar-accent-foreground))"
                                : "hsl(var(--sidebar-foreground))",
                              "&:hover": {
                                bgcolor: isChildActive
                                  ? "hsl(var(--sidebar-accent))"
                                  : "hsl(var(--muted))",
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <ChildIcon
                                sx={{ color: "inherit", fontSize: 20 }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={child.label}
                              primaryTypographyProps={{
                                fontSize: 13,
                                fontWeight: isChildActive ? 600 : 500,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
            p: 1,
            bgcolor: "hsl(var(--sidebar-accent))",
            borderRadius: 1,
          }}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "hsl(var(--primary))",
            }}
          >
            AC
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
            >
              Alex Carter
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "hsl(var(--muted-foreground))" }}
            >
              Store Manager
            </Typography>
          </Box>
          <ThemeToggle />
        </Box>
      </Box>
    </Drawer>
  );
}
