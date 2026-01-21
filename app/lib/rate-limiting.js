// @ts-check

/**
 * Rate limiting configuration for Openwhyd
 *
 * This module provides different rate limiting strategies to protect against
 * bursts of incoming HTTP calls that can overwhelm the server.
 *
 * Strategy:
 * - Global rate limit: Applies to all routes to prevent general abuse
 * - API rate limit: Stricter limits for API endpoints that perform database operations
 * - Login rate limit: Very strict limits for authentication endpoints to prevent brute force
 * - Static content: More lenient limits for static assets
 *
 * Note: Rate limiting can be disabled by setting DISABLE_RATE_LIMIT=true (e.g., for testing)
 */

const { rateLimit } = require('express-rate-limit');

// Check if rate limiting should be disabled (e.g., during testing)
const isRateLimitingDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

// Create a no-op middleware when rate limiting is disabled
const noOpRateLimiter = (req, res, next) => next();

/**
 * Global rate limiter for all routes
 * Allows 500 requests per minute per IP
 */
exports.globalRateLimiter = isRateLimitingDisabled
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      limit: 500, // Limit each IP to 500 requests per window
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

/**
 * API rate limiter for database-heavy operations
 * Allows 150 requests per minute per IP
 */
exports.apiRateLimiter = isRateLimitingDisabled
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      limit: 150, // Limit each IP to 150 requests per window
      message: { error: 'Too many API requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Strict rate limiter for authentication endpoints
 * Allows 5 login attempts per 15 minutes per IP
 */
exports.authRateLimiter = isRateLimitingDisabled
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 5, // Limit each IP to 5 requests per window
      message: { error: 'Too many login attempts, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful logins against the limit
    });

/**
 * Moderate rate limiter for search and other resource-intensive operations
 * Allows 100 requests per minute per IP
 */
exports.searchRateLimiter = isRateLimitingDisabled
  ? noOpRateLimiter
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      limit: 100, // Limit each IP to 100 requests per window
      message: { error: 'Too many search requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false,
    });
