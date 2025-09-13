// Temporary storage for registration data
// In production, this should be replaced with Redis or a proper database

const tempData = new Map();

// Store data temporarily
const store = (key, data, ttl = 3600000) => { // 1 hour default TTL
  const expiry = Date.now() + ttl;
  tempData.set(key, {
    data,
    expiry
  });
  
  // Clean up expired data
  setTimeout(() => {
    if (tempData.has(key)) {
      const item = tempData.get(key);
      if (item.expiry <= Date.now()) {
        tempData.delete(key);
      }
    }
  }, ttl);
  
  return true;
};

// Retrieve data
const retrieve = (key) => {
  if (!tempData.has(key)) {
    return null;
  }
  
  const item = tempData.get(key);
  
  // Check if expired
  if (item.expiry <= Date.now()) {
    tempData.delete(key);
    return null;
  }
  
  return item.data;
};

// Update data
const update = (key, newData, ttl = 3600000) => {
  if (!tempData.has(key)) {
    return false;
  }
  
  const item = tempData.get(key);
  
  // Check if expired
  if (item.expiry <= Date.now()) {
    tempData.delete(key);
    return false;
  }
  
  // Update data
  item.data = { ...item.data, ...newData };
  item.expiry = Date.now() + ttl;
  
  return true;
};

// Remove data
const remove = (key) => {
  return tempData.delete(key);
};

// Clean up expired data
const cleanup = () => {
  const now = Date.now();
  for (const [key, item] of tempData.entries()) {
    if (item.expiry <= now) {
      tempData.delete(key);
    }
  }
};

// Generate a unique token
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Run cleanup every 5 minutes
setInterval(cleanup, 300000);

module.exports = {
  store,
  retrieve,
  update,
  remove,
  cleanup,
  generateToken
};
