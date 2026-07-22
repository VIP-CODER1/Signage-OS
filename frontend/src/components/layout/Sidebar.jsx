import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Divider, Typography, Avatar, useTheme,
} from '@mui/material';
import {
  Devices, Upload, Logout, Tv, Dashboard,
} from '@mui/icons-material';
import { logoutAdmin } from '../../redux/slices/authSlice';
import AIPanel from './AIPanel';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
  { path: '/displays', label: 'Displays', icon: <Devices /> },
  { path: '/displays/upload', label: 'Bulk Upload', icon: <Upload /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const token = useSelector((s) => s.auth.token);
  const userEmail = useSelector((s) => s.auth.user);

  if (!token) return null;

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, px: 2, py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32, height: 32, borderRadius: 1.5,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Tv sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Box sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>
            Signage OS
          </Box>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path ||
            (item.path === '/displays' && location.pathname.startsWith('/displays/') &&
             !location.pathname.startsWith('/displays/upload'));
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={active}
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 40,
                  borderRadius: 1.5,
                  px: 1.5,
                  '&.Mui-selected': {
                    bgcolor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                    color: 'primary.main',
                    '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)' },
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                  },
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, fontSize: 20, color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.8125rem',
                    fontWeight: active ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <AIPanel />

      <Divider />

      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32, height: 32,
              bgcolor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
              color: 'primary.main',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {userEmail ? userEmail[0].toUpperCase() : 'A'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6875rem', display: 'block', lineHeight: 1.2 }}>
              Signed in as
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.75rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userEmail || 'Admin'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ px: 1, pb: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 36,
              borderRadius: 1.5,
              px: 1.5,
              bgcolor: isDark ? 'rgba(255,59,48,0.12)' : 'rgba(255,59,48,0.08)',
              '&:hover': { bgcolor: isDark ? 'rgba(255,59,48,0.2)' : 'rgba(255,59,48,0.12)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: '#ef4444', fontSize: 20 }}>
              <Logout />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.8125rem' }}
              sx={{ '& .MuiListItemText-primary': { color: '#ef4444', fontWeight: 500 } }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
