// Utility function to clear authentication data
export const clearAuthData = () => {
  try {
    // Clear all authentication-related localStorage items
    localStorage.removeItem('userData');
    localStorage.removeItem('dashboardData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userType');
    localStorage.removeItem('loginTime');
    
    // Clear any other potential auth-related items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('auth') || 
        key.includes('user') || 
        key.includes('token') ||
        key.includes('login')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Authentication data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing authentication data:', error);
    return false;
  }
};

// Function to check if user is authenticated
export const isUserAuthenticated = () => {
  try {
    const userData = localStorage.getItem('userData');
    const authToken = localStorage.getItem('authToken');
    return !!(userData && authToken);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

// Function to get stored user data
export const getStoredUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting stored user data:', error);
    return null;
  }
};
