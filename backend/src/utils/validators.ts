export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    const minLength = 6;
    return password.length >= minLength;
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
    if (!data.password || !validatePassword(data.password)) {
        errors.push('Password must be at least 6 characters');
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
