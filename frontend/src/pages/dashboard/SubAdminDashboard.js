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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
  Class,
  Assignment,
  Schedule,
  AdminPanelSettings,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { authService } from '../../services/authService';

const SubAdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = authService.getStoredUserData();
    const storedDashboardData = authService.getStoredDashboardData();
    
    setUserData(storedUserData);
    setDashboardData(storedDashboardData);
    
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
      await authService.logout();
      // The AuthContext will handle the navigation automatically
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.clear();
      // The AuthContext will handle the navigation automatically
    }
  };

  const statsCards = [
    {
      title: 'Total Students',
      value: '850',
      icon: <People sx={{ fontSize: 40, color: COLORS.PRIMARY }} />,
      color: '#e3f2fd',
      trend: '+25'
    },
    {
      title: 'Total Teachers',
      value: '32',
      icon: <School sx={{ fontSize: 40, color: COLORS.SUCCESS }} />,
      color: '#e8f5e8',
      trend: '+2'
    },
    {
      title: 'Active Classes',
      value: '45',
      icon: <Class sx={{ fontSize: 40, color: COLORS.WARNING }} />,
      color: '#fff3e0',
      trend: '3 new'
    },
    {
      title: 'Pending Tasks',
      value: '8',
      icon: <Assignment sx={{ fontSize: 40, color: COLORS.ERROR }} />,
      color: '#ffebee',
      trend: '2 urgent'
    }
  ];

  const recentActivities = [
    { id: 1, title: 'New teacher registration approved', time: '1 hour ago', type: 'teacher' },
    { id: 2, title: 'Student enrollment batch processed', time: '3 hours ago', type: 'student' },
    { id: 3, title: 'Class schedule updated for next week', time: '5 hours ago', type: 'schedule' },
    { id: 4, title: 'Monthly report generated', time: '1 day ago', type: 'report' },
  ];

  const pendingTasks = [
    { id: 1, title: 'Review teacher applications', priority: 'high', dueDate: 'Today' },
    { id: 2, title: 'Update student records', priority: 'medium', dueDate: 'Tomorrow' },
    { id: 3, title: 'Schedule parent meetings', priority: 'low', dueDate: 'Dec 20' },
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
          <AdminPanelSettings sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sub Admin Dashboard
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
              {userData?.profile?.firstName?.charAt(0) || 'A'}
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
            Welcome back, {userData?.profile?.firstName || 'Sub Admin'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and oversee your organization's operations efficiently.
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

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD, mb: 3 }}>
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
                      startIcon={<Class />}
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
                      Manage Classes
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

          {/* Pending Tasks */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Pending Tasks
                </Typography>
                <List>
                  {pendingTasks.map((task) => (
                    <ListItem key={task.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Assignment sx={{ color: task.priority === 'high' ? COLORS.ERROR : task.priority === 'medium' ? COLORS.WARNING : COLORS.SUCCESS }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={`Due: ${task.dueDate}`}
                      />
                      <Chip 
                        label={task.priority} 
                        size="small" 
                        color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Recent Activities
                </Typography>
                <List>
                  {recentActivities.map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {activity.type === 'teacher' && <School sx={{ color: COLORS.SUCCESS }} />}
                        {activity.type === 'student' && <People sx={{ color: COLORS.PRIMARY }} />}
                        {activity.type === 'schedule' && <Schedule sx={{ color: COLORS.WARNING }} />}
                        {activity.type === 'report' && <Assessment sx={{ color: COLORS.ERROR }} />}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.time}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Sub Admin Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Sub Admin Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Organization
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.organizationName || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.role || 'Sub Admin'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {userData?.email || 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Permissions
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Student & Teacher Management
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

export default SubAdminDashboard;
