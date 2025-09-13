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
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  School,
  Book,
  Assignment,
  Assessment,
  Settings,
  Logout,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  TrendingUp,
  Notifications,
  Class,
  Schedule,
  Grade,
  Quiz,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../theme/constants';
import { authService } from '../../services/authService';

const StudentDashboard = () => {
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
      title: 'Active Courses',
      value: '6',
      icon: <Book sx={{ fontSize: 40, color: COLORS.PRIMARY }} />,
      color: '#e3f2fd',
      trend: 'All enrolled'
    },
    {
      title: 'Assignments',
      value: '8',
      icon: <Assignment sx={{ fontSize: 40, color: COLORS.SUCCESS }} />,
      color: '#e8f5e8',
      trend: '2 pending'
    },
    {
      title: 'Quizzes Taken',
      value: '12',
      icon: <Quiz sx={{ fontSize: 40, color: COLORS.WARNING }} />,
      color: '#fff3e0',
      trend: 'Avg: 85%'
    },
    {
      title: 'Overall Grade',
      value: 'A-',
      icon: <Grade sx={{ fontSize: 40, color: COLORS.ERROR }} />,
      color: '#ffebee',
      trend: '+5%'
    }
  ];

  const upcomingAssignments = [
    { id: 1, subject: 'Mathematics', title: 'Algebra Problems', dueDate: 'Tomorrow', status: 'pending' },
    { id: 2, subject: 'Physics', title: 'Lab Report', dueDate: 'Dec 15', status: 'in-progress' },
    { id: 3, subject: 'Chemistry', title: 'Chemical Equations', dueDate: 'Dec 18', status: 'pending' },
  ];

  const recentGrades = [
    { id: 1, subject: 'Mathematics', assignment: 'Trigonometry Quiz', grade: 'A', score: '92/100' },
    { id: 2, subject: 'Physics', assignment: 'Mechanics Test', grade: 'B+', score: '87/100' },
    { id: 3, subject: 'Chemistry', assignment: 'Periodic Table Quiz', grade: 'A-', score: '89/100' },
  ];

  const todaySchedule = [
    { id: 1, subject: 'Mathematics', time: '09:00 AM', room: 'Room 201', teacher: 'Mr. Smith' },
    { id: 2, subject: 'Physics', time: '11:00 AM', room: 'Lab 3', teacher: 'Ms. Johnson' },
    { id: 3, subject: 'Chemistry', time: '02:00 PM', room: 'Room 105', teacher: 'Dr. Brown' },
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
            Student Dashboard
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
              {userData?.profile?.firstName?.charAt(0) || 'S'}
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
            Welcome back, {userData?.profile?.firstName || 'Student'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep up the great work in your studies.
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
          {/* Today's Schedule */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Today's Schedule
                </Typography>
                <List>
                  {todaySchedule.map((classItem) => (
                    <ListItem key={classItem.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Class sx={{ color: COLORS.PRIMARY }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={classItem.subject}
                        secondary={`${classItem.time} • ${classItem.room} • ${classItem.teacher}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Assignments */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Upcoming Assignments
                </Typography>
                <List>
                  {upcomingAssignments.map((assignment) => (
                    <ListItem key={assignment.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Assignment sx={{ color: assignment.status === 'pending' ? COLORS.ERROR : COLORS.WARNING }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={assignment.title}
                        secondary={`${assignment.subject} • Due: ${assignment.dueDate}`}
                      />
                      <Chip 
                        label={assignment.status} 
                        size="small" 
                        color={assignment.status === 'pending' ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Grades */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Recent Grades
                </Typography>
                <List>
                  {recentGrades.map((grade) => (
                    <ListItem key={grade.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Grade sx={{ color: grade.grade === 'A' ? COLORS.SUCCESS : grade.grade === 'B+' ? COLORS.WARNING : COLORS.ERROR }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={grade.assignment}
                        secondary={`${grade.subject} • ${grade.score}`}
                      />
                      <Chip 
                        label={grade.grade} 
                        size="small" 
                        color={grade.grade === 'A' ? 'success' : grade.grade === 'B+' ? 'warning' : 'error'}
                        variant="filled"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Student Info */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: BORDER_RADIUS.LG, boxShadow: SHADOWS.MD }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Student Information
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
                    Grade Level
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.grade || 'Grade 10'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Academic Level
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {dashboardData?.academicLevel || 'High School'}
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

export default StudentDashboard;
