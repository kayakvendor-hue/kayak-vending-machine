export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    // Must be at least 8 characters
    if (password.length < 8) return false;
    
    // Must have uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Must have lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Must have at least one number
    if (!/[0-9]/.test(password)) return false;
    
    // Must have at least one special symbol
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
};

export const validateWaiverSignature = (signature: string): boolean => {
    return signature.trim().length > 0;
};

export const validateRentalDates = (startDate: Date, endDate: Date): boolean => {
    return startDate < endDate;
};

export const validateSignup = (data: any) => {
    const errors: string[] = [];
    if (!data.email || !validateEmail(data.email)) {
        errors.push('Valid email is required');
    }
    if (!data.password) {
        errors.push('Password is required');
    } else if (!validatePassword(data.password)) {
        errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special symbol (!@#$%^&*...)');
    }
    if (errors.length > 0) {
        return { error: { details: errors.map(msg => ({ message: msg })) } };
    }
    return { error: null };
};

export const validateLogin = (data: any) => {
    const errors: string[] = [];
    if (!data.email || !validateEmail(data.email)) {
        errors.push('Valid email is required');
    }
    if (!data.password) {
        errors.push('Password is required');
    }
    if (errors.length > 0) {
        return { error: { details: errors.map(msg => ({ message: msg })) } };
    }
    return { error: null };
};
