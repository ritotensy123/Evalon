// Navigation service for handling routing and navigation
export const navigationService = {
  // Navigate to different pages
  navigateToLanding: () => {
    window.location.href = '/';
  },

  navigateToLogin: () => {
    window.location.href = '/login';
  },

  navigateToOnboarding: () => {
    window.location.href = '/onboarding';
  },

  navigateToDashboard: () => {
    window.location.href = '/dashboard';
  },

  // Navigate to specific registration pages
  navigateToOrgRegistration: () => {
    window.location.href = '/organisation-registration';
  },

  navigateToTeacherRegistration: () => {
    window.location.href = '/teacher-registration';
  },

  navigateToStudentRegistration: () => {
    window.location.href = '/student-registration';
  },

  // Navigate to specific dashboards based on user type
  navigateToUserDashboard: (userType) => {
    switch (userType) {
      case 'organization_admin':
        window.location.href = '/dashboard/organization';
        break;
      case 'sub_admin':
        window.location.href = '/dashboard/sub-admin';
        break;
      case 'teacher':
        window.location.href = '/dashboard/teacher';
        break;
      case 'student':
        window.location.href = '/dashboard/student';
        break;
      default:
        window.location.href = '/dashboard';
    }
  },

  // Get current page from URL
  getCurrentPage: () => {
    const path = window.location.pathname;
    switch (path) {
      case '/':
        return 'landing';
      case '/login':
        return 'login';
      case '/onboarding':
        return 'onboarding';
      case '/organisation-registration':
        return 'organisation-registration';
      case '/teacher-registration':
        return 'teacher-onboarding';
      case '/student-registration':
        return 'student-onboarding';
      case '/dashboard':
      case '/dashboard/organization':
      case '/dashboard/teacher':
      case '/dashboard/student':
      case '/dashboard/sub-admin':
        return 'dashboard';
      default:
        return 'landing';
    }
  },

  // Check if current page requires authentication
  requiresAuth: (page) => {
    const protectedPages = ['dashboard'];
    return protectedPages.includes(page);
  },

  // Handle authentication redirect
  handleAuthRedirect: () => {
    const currentPage = navigationService.getCurrentPage();
    if (navigationService.requiresAuth(currentPage)) {
      navigationService.navigateToLogin();
    }
  }
};

export default navigationService;
