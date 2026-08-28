import rateLimit from 'express-rate-limit';

// Rate limiter for signup endpoint - 5 attempts per 15 minutes per IP
export const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many signup attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for admin IPs if needed (optional)
        return false;
    }
});

// Rate limiter for login endpoint - 10 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for successful logins (only count failures)
    skip: (req) => {
        // This will count all attempts; in production you might want to 
        // only count failed attempts, but that requires custom logic
        return false;
    }
});

// Rate limiter for password reset request endpoint - 3 attempts per 1 hour per IP
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many password reset requests, please try again after 1 hour',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for password reset confirmation - 5 attempts per 15 minutes per IP
export const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many password reset attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter - 100 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});
