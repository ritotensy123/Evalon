// Performance utility functions

export const measureTime = (fn, name = 'Function') => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${(end - start).toFixed(2)}ms`);
  }
  
  return result;
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadComponent = (importFn) => {
  return () => {
    const promise = importFn();
    return {
      promise,
      component: promise.then(module => module.default),
    };
  };
};

export const createIntersectionObserver = (callback, options = {}) => {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options,
  });
};

export const optimizeImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = createIntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};

export const getDevicePixelRatio = () => {
  return window.devicePixelRatio || 1;
};

export const isLowEndDevice = () => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const memory = navigator.deviceMemory;
  
  return (
    (connection && connection.effectiveType === 'slow-2g') ||
    (memory && memory < 4) ||
    navigator.hardwareConcurrency < 4
  );
};

export const optimizeForLowEndDevices = () => {
  if (isLowEndDevice()) {
    // Reduce animations and effects for low-end devices
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    document.documentElement.style.setProperty('--transition-duration', '0.1s');
  }
};
