/**
 * Async Wrapper Middleware
 * 
 * Wraps async route handlers to automatically catch errors
 * and pass them to the error handler middleware
 * 
 * Usage:
 *   const asyncWrapper = require('./middleware/asyncWrapper');
 *   router.get('/route', asyncWrapper(async (req, res) => {
 *     // async code here
 *   }));
 */

/**
 * Wraps an async function to catch errors and pass them to Express error handler
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped function that catches errors
 */
const asyncWrapper = (fn) => {
  return (req, res, next) => {
    // Execute the async function and catch any errors
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncWrapper;






