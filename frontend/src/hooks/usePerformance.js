import { useEffect, useRef, useCallback } from 'react';
import { useState } from 'react';

export const usePerformance = () => {
  const performanceRef = useRef({
    startTime: performance.now(),
    measurements: [],
  });

  const measurePerformance = useCallback((name) => {
    const endTime = performance.now();
    const duration = endTime - performanceRef.current.startTime;
    
    performanceRef.current.measurements.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return performanceRef.current.measurements;
  }, []);

  const resetPerformance = useCallback(() => {
    performanceRef.current = {
      startTime: performance.now(),
      measurements: [],
    };
  }, []);

  return {
    measurePerformance,
    getPerformanceMetrics,
    resetPerformance,
  };
};

export const useIntersectionObserver = (callback, options = {}) => {
  const observerRef = useRef(null);
  const elementRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    }, options);

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return elementRef;
};

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
