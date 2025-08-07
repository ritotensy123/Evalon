import React, { Suspense, lazy, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { optimizeForLowEndDevices } from './utils/performance';

// Lazy load the main App component
const App = lazy(() => import('./App'));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.2rem',
    color: '#667eea'
  }}>
    Loading Evalon...
  </div>
);

// Performance optimization component
const PerformanceOptimizer = ({ children }) => {
  useEffect(() => {
    // Optimize for low-end devices
    optimizeForLowEndDevices();
    
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload theme fonts if needed
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    preloadCriticalResources();
  }, []);

  return children;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PerformanceOptimizer>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </PerformanceOptimizer>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(); 