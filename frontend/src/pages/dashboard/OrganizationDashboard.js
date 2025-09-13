import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School,
  People,
  Book,
  Assessment,
  Settings,
  Logout,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  TrendingUp,
  Notifications,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { useAuth } from '../../contexts/AuthContext';

const OrganizationDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, dashboardData, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Loading animation
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: '1,250',
      icon: <People sx={{ fontSize: 40, color: COLORS.PRIMARY }} />,
      color: '#e3f2fd',
      trend: '+12%'
    },
    {
      title: 'Total Teachers',
      value: '45',
      icon: <School sx={{ fontSize: 40, color: COLORS.SUCCESS }} />,
      color: '#e8f5e8',
      trend: '+5%'
    },
    {
      title: 'Active Courses',
      value: '28',
      icon: <Book sx={{ fontSize: 40, color: COLORS.WARNING }} />,
      color: '#fff3e0',
      trend: '+8%'
    },
    {
      title: 'Assessments',
      value: '156',
      icon: <Assessment sx={{ fontSize: 40, color: COLORS.ERROR }} />,
      color: '#ffebee',
      trend: '+15%'
    }
  ];

  if (!isLoaded) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Typography variant="h4" sx={{ color: 'white' }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* App Bar */}
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: SHADOWS.LG
        }}
      >
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {dashboardData?.organizationName || 'Organization Dashboard'}
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
              {user?.profile?.firstName?.charAt(0) || 'A'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleMenuClose}>
              <Settings sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Welcome back, {user?.profile?.firstName || 'Admin'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening at {dashboardData?.organizationName} today.
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  borderRadius: BORDER_RADIUS.LG,
                  boxShadow: SHADOWS.MD,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: SHADOWS.XL,
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: BORDER_RADIUS.MD, 
                        backgroundColor: card.color,
                        mr: 2
                      }}
                    >
                      {card.icon}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {card.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={card.trend} 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
                      sx={{ 
                        py: 2, 
                        borderRadius: BORDER_RADIUS.MD,
                        borderColor: COLORS.PRIMARY,
                        color: COLORS.PRIMARY,
                        '&:hover': {
                          backgroundColor: COLORS.PRIMARY,
                          color: 'white'
                        }
                      }}
                    >
                      Manage Students
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<School />}
                      sx={{ 
                        py: 2, 
                        borderRadius: BORDER_RADIUS.MD,
                        borderColor: COLORS.SUCCESS,
                        color: COLORS.SUCCESS,
                        '&:hover': {
                          backgroundColor: COLORS.SUCCESS,
                          color: 'white'
                        }
                      }}
                    >
                      Manage Teachers
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Book />}
                      sx={{ 
                        py: 2, 
                        borderRadius: BORDER_RADIUS.MD,
                        borderColor: COLORS.WARNING,
                        color: COLORS.WARNING,
                        '&:hover': {
                          backgroundColor: COLORS.WARNING,
                          color: 'white'
                        }
                      }}
                    >
                      Manage Courses
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assessment />}
                      sx={{ 
                        py: 2, 
                        borderRadius: BORDER_RADIUS.MD,
                        borderColor: COLORS.ERROR,
                        color: COLORS.ERROR,
                        '&:hover': {
                          backgroundColor: COLORS.ERROR,
                          color: 'white'
                        }
                      }}
                    >
                      View Reports
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Organization Info
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Organization Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.organizationCode || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.role || 'Organization Admin'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user?.email || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default OrganizationDashboard;
