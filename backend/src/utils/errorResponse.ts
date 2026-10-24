// Avoid leaking internal error details (DB/Stripe/library error text) to clients in production.
// Full error is still logged server-side by the caller's console.error before this runs.
export const safeError = (error: unknown, fallback = 'An unexpected error occurred'): string => {
    if (process.env.NODE_ENV === 'production') return fallback;
    return error instanceof Error ? error.message : String(error);
};
