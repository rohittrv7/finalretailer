import { ReactNode } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'hsl(var(--background))',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
