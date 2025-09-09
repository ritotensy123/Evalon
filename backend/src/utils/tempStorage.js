// Temporary storage for registration data
// In production, this should be replaced with Redis or a proper session store

const tempStorage = new Map();

// Generate a unique token
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Store data with expiration
const store = (token, data, ttl = 30 * 60 * 1000) => { // 30 minutes default
  tempStorage.set(token, {
    data,
    expires: Date.now() + ttl
  });
  
  // Clean up expired entries
  cleanup();
};

// Retrieve data
const retrieve = (token) => {
  const entry = tempStorage.get(token);
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expires) {
    tempStorage.delete(token);
    return null;
  }
  
  return entry.data;
};

// Update data
const update = (token, newData) => {
  const entry = tempStorage.get(token);
  
  if (!entry) {
    return false;
  }
  
  if (Date.now() > entry.expires) {
    tempStorage.delete(token);
    return false;
  }
  
  entry.data = { ...entry.data, ...newData };
  return true;
};

// Delete data
const remove = (token) => {
  return tempStorage.delete(token);
};

// Clean up expired entries
const cleanup = () => {
  const now = Date.now();
  for (const [token, entry] of tempStorage.entries()) {
    if (now > entry.expires) {
      tempStorage.delete(token);
    }
  }
};

// Get storage stats
const getStats = () => {
  cleanup();
  return {
    size: tempStorage.size,
    entries: Array.from(tempStorage.keys())
  };
};

module.exports = {
  generateToken,
  store,
  retrieve,
  update,
  remove,
  cleanup,
  getStats
};

