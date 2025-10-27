// Token helper utilities
export const clearAuthToken = () => {
  localStorage.removeItem('authToken');
  console.log('🔐 Auth token cleared from localStorage');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
  console.log('🔐 Auth token saved to localStorage');
};

export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token has expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Token is malformed:', error.message);
    return false;
  }
};

export const getTokenInfo = (token) => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    const timeLeft = exp ? exp - now : 0;
    
    return {
      valid: timeLeft > 0,
      expiresAt: exp ? new Date(exp * 1000).toLocaleString() : 'Unknown',
      timeLeft: timeLeft > 0 ? Math.floor(timeLeft / 60) : 0,
      userId: payload.userId,
      userType: payload.userType
    };
  } catch (error) {
    return null;
  }
};
