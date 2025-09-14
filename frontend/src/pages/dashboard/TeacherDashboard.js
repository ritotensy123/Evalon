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
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { authService } from '../../services/authService';

const TeacherDashboard = () => {
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
      title: 'My Students',
      value: '85',
      icon: <People sx={{ fontSize: 40, color: COLORS.PRIMARY }} />,
      color: '#e3f2fd',
      trend: '+3'
    },
    {
      title: 'Active Classes',
      value: '6',
      icon: <Class sx={{ fontSize: 40, color: COLORS.SUCCESS }} />,
      color: '#e8f5e8',
      trend: '2 new'
    },
    {
      title: 'Assignments',
      value: '12',
      icon: <Assignment sx={{ fontSize: 40, color: COLORS.WARNING }} />,
      color: '#fff3e0',
      trend: '3 pending'
    },
    {
      title: 'Assessments',
      value: '8',
      icon: <Assessment sx={{ fontSize: 40, color: COLORS.ERROR }} />,
      color: '#ffebee',
      trend: '1 upcoming'
    }
  ];

  const recentActivities = [
    { id: 1, title: 'Math Assignment #5 graded', time: '2 hours ago', type: 'assignment' },
    { id: 2, title: 'New student John Doe enrolled', time: '4 hours ago', type: 'student' },
    { id: 3, title: 'Science quiz scheduled for tomorrow', time: '6 hours ago', type: 'assessment' },
    { id: 4, title: 'Parent meeting completed', time: '1 day ago', type: 'meeting' },
  ];

  const upcomingClasses = [
    { id: 1, subject: 'Mathematics', class: 'Grade 10A', time: '09:00 AM', room: 'Room 201' },
    { id: 2, subject: 'Physics', class: 'Grade 11B', time: '11:00 AM', room: 'Lab 3' },
    { id: 3, subject: 'Mathematics', class: 'Grade 9C', time: '02:00 PM', room: 'Room 105' },
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
            Teacher Dashboard
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
              {userData?.profile?.firstName?.charAt(0) || 'T'}
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
            Welcome back, {userData?.profile?.firstName || 'Teacher'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ready to inspire and educate your students today.
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
                      startIcon={<Assignment />}
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
                      Create Assignment
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
                        borderColor: COLORS.SUCCESS,
                        color: COLORS.SUCCESS,
                        '&:hover': {
                          backgroundColor: COLORS.SUCCESS,
                          color: 'white'
                        }
                      }}
                    >
                      Schedule Quiz
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<People />}
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
                      View Students
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Schedule />}
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
                      View Schedule
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Classes */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Today's Classes
                </Typography>
                <List>
                  {upcomingClasses.map((classItem) => (
                    <ListItem key={classItem.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Class sx={{ color: COLORS.PRIMARY }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={classItem.subject}
                        secondary={`${classItem.class} • ${classItem.time} • ${classItem.room}`}
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
                        {activity.type === 'assignment' && <Assignment sx={{ color: COLORS.WARNING }} />}
                        {activity.type === 'student' && <People sx={{ color: COLORS.PRIMARY }} />}
                        {activity.type === 'assessment' && <Assessment sx={{ color: COLORS.ERROR }} />}
                        {activity.type === 'meeting' && <Schedule sx={{ color: COLORS.SUCCESS }} />}
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

          {/* Teacher Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Teacher Information
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
                    Subjects
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.subjects?.join(', ') || 'Mathematics, Physics'}
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
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherDashboard;
